import pytest
import os
import logging
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.edge.service import Service as EdgeService
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from webdriver_manager.microsoft import EdgeChromiumDriverManager

logger = logging.getLogger(__name__)


# Determinar navegadores disponibles
def check_browser_availability():
    available = ["chrome"]

    try:
        options = webdriver.FirefoxOptions()
        service = FirefoxService(GeckoDriverManager().install())
        drv = webdriver.Firefox(service=service, options=options)
        drv.quit()
        available.append("firefox")
        logger.info("✓ Firefox disponible")
    except Exception as e:
        logger.debug(f"Firefox no disponible: {e}")

    try:
        options = webdriver.EdgeOptions()
        service = EdgeService(EdgeChromiumDriverManager().install())
        drv = webdriver.Edge(service=service, options=options)
        drv.quit()
        available.append("edge")
        logger.info("✓ Edge disponible")
    except Exception as e:
        logger.debug(f"Edge no disponible: {e}")

    return available


BROWSERS = os.getenv("BROWSERS", "").split(",") if os.getenv("BROWSERS") else check_browser_availability()
BROWSERS = [b.strip() for b in BROWSERS if b.strip()]


def get_driver(browser_name="chrome"):
    if browser_name.lower() == "chrome":
        options = webdriver.ChromeOptions()
        if os.getenv("HEADLESS") == "true":
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--start-maximized")
        service = ChromeService(ChromeDriverManager().install())
        return webdriver.Chrome(service=service, options=options)

    if browser_name.lower() == "firefox":
        options = webdriver.FirefoxOptions()
        if os.getenv("HEADLESS") == "true":
            options.add_argument("-headless")
        service = FirefoxService(GeckoDriverManager().install())
        return webdriver.Firefox(service=service, options=options)

    if browser_name.lower() == "edge":
        options = webdriver.EdgeOptions()
        if os.getenv("HEADLESS") == "true":
            options.add_argument("--headless")
        service = EdgeService(EdgeChromiumDriverManager().install())
        return webdriver.Edge(service=service, options=options)

    raise ValueError(f"Navegador no soportado: {browser_name}")


@pytest.fixture(params=BROWSERS)
def driver(request):
    try:
        drv = get_driver(request.param)
        drv.implicitly_wait(10)
        # Exponer driver para hooks
        request.node._driver = drv
        yield drv
        drv.quit()
    except Exception as e:
        logger.error(f"Error inicializando {request.param}: {e}")
        pytest.skip(f"Navegador {request.param} no disponible")


@pytest.fixture
def wait(driver):
    return WebDriverWait(driver, 10)


class SeleniumHelper:
    def __init__(self, driver, wait):
        self.driver = driver
        self.wait = wait

    def click_element(self, locator):
        element = self.wait.until(EC.element_to_be_clickable(locator))
        element.click()

    def send_keys(self, locator, keys):
        element = self.wait.until(EC.presence_of_element_located(locator))
        element.clear()
        element.send_keys(keys)

    def get_text(self, locator):
        element = self.wait.until(EC.presence_of_element_located(locator))
        return element.text

    def wait_for_element(self, locator):
        return self.wait.until(EC.presence_of_element_located(locator))

    def wait_for_url_contains(self, substring):
        self.wait.until(EC.url_contains(substring))


@pytest.fixture
def helper(driver, wait):
    return SeleniumHelper(driver, wait)


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    if rep.when == "call" and rep.failed:
        driver = getattr(item, "_driver", None) or item.funcargs.get("driver")
        if not driver:
            return
        screenshots_dir = Path(item.config.rootpath) / "tests" / "screenshots"
        screenshots_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{item.name}.png"
        path = screenshots_dir / filename
        try:
            driver.save_screenshot(str(path))
            logger.info(f"Saved screenshot: {path}")
        except Exception as e:
            logger.warning(f"Could not save screenshot for {item.name}: {e}")
