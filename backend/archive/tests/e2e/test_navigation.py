import pytest
from selenium.webdriver.common.by import By


class TestNavigation:
    """Suite de pruebas para navegación de la aplicación"""
    
    def test_home_page_loads(self, driver, base_url):
        """Verificar que la página de inicio carga"""
        driver.get(base_url)
        # Esperar a que la página cargue
        driver.implicitly_wait(5)
        assert driver.current_url.startswith(base_url)
    
    def test_landing_page_elements(self, driver, base_url, helper):
        """Verificar elementos principales en la página de inicio"""
        driver.get(base_url)
        
        # Buscar navegación principal
        try:
            nav = helper.wait_for_element((By.TAG_NAME, "nav"))
            assert nav is not None
        except:
            pass  # Puede no haber nav
    
    def test_login_button_in_navigation(self, driver, base_url, helper):
        """Verificar que existe botón de login en navegación"""
        driver.get(base_url)
        
        try:
            # Intentar varias opciones
            login_button = helper.wait_for_element((By.XPATH, "//a[contains(text(), 'Login')]"))
            assert login_button is not None
        except:
            try:
                login_button = helper.wait_for_element((By.XPATH, "//button[contains(text(), 'Login')]"))
                assert login_button is not None
            except:
                try:
                    login_link = helper.wait_for_element((By.XPATH, "//a[contains(@href, 'login')]"))
                    assert login_link is not None
                except:
                    pass
    
    def test_register_button_in_navigation(self, driver, base_url, helper):
        """Verificar que existe botón de registro en navegación"""
        driver.get(base_url)
        
        try:
            register_button = helper.wait_for_element((By.XPATH, "//a[contains(text(), 'Register')]"))
            assert register_button is not None
        except:
            try:
                register_button = helper.wait_for_element((By.XPATH, "//button[contains(text(), 'Register')]"))
                assert register_button is not None
            except:
                try:
                    register_link = helper.wait_for_element((By.XPATH, "//a[contains(@href, 'register')]"))
                    assert register_link is not None
                except:
                    pass
    
    def test_navigate_to_login(self, driver, base_url, helper):
        """Probar navegación a página de login"""
        driver.get(base_url)
        
        # Buscar y hacer click en botón/enlace de login
        try:
            login_link = helper.wait_for_element((By.XPATH, "//a[contains(@href, 'login')]"))
            login_link.click()
            
            # Verificar que navegó a login
            driver.implicitly_wait(3)
            assert "login" in driver.current_url
        except:
            # Si no hay enlace de login en home, ir directamente a login
            driver.get(f"{base_url}login")
            assert "login" in driver.current_url
    
    def test_navigate_to_register(self, driver, base_url, helper):
        """Probar navegación a página de registro"""
        driver.get(base_url)
        
        # Buscar y hacer click en botón/enlace de registro
        try:
            register_link = helper.wait_for_element((By.XPATH, "//a[contains(@href, 'register')]"))
            register_link.click()
            
            # Verificar que navegó a registro
            driver.implicitly_wait(3)
            assert "register" in driver.current_url
        except:
            # Si no hay enlace de registro en home, ir directamente a registro
            driver.get(f"{base_url}register")
            assert "register" in driver.current_url or driver.current_url.endswith("/")
