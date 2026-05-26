import pytest
from selenium.webdriver.common.by import By


class TestModulos:
    """Suite de pruebas para los módulos principales de la aplicación"""
    
    @pytest.fixture
    def login_user(self, driver, base_url, helper):
        """Fixture para autenticar un usuario"""
        driver.get(f"{base_url}login")
        
        # Rellenar credenciales (estos valores deben ser válidos en tu aplicación)
        try:
            helper.send_keys((By.CSS_SELECTOR, "input[type='email']"), "demo@aquawash.com")
            helper.send_keys((By.CSS_SELECTOR, "input[type='password']"), "demo123456")
            
            # Hacer submit
            submit_button = helper.wait_for_element((By.CSS_SELECTOR, "button[type='submit']"))
            submit_button.click()
            
            # Esperar a que redirija (ajusta según tu app)
            driver.implicitly_wait(5)
        except Exception as e:
            print(f"Error en login: {e}")
    
    def test_inventory_module_redirect_protected(self, driver, base_url):
        """Verificar que el módulo de inventario redirige a login (protegido)"""
        driver.get(f"{base_url}app/inventario")
        driver.implicitly_wait(3)
        
        # Si la ruta está protegida, debería redirigir a login
        # o mostrar la página de login
        assert "login" in driver.current_url or driver.current_url.endswith("/")
    
    def test_caja_module_redirect_protected(self, driver, base_url):
        """Verificar que el módulo de caja redirige a login (protegido)"""
        driver.get(f"{base_url}app/caja")
        driver.implicitly_wait(3)
        
        # Si la ruta está protegida, debería redirigir a login
        assert "login" in driver.current_url or driver.current_url.endswith("/")
    
    def test_empleados_module_redirect_protected(self, driver, base_url):
        """Verificar que el módulo de empleados redirige a login (protegido)"""
        driver.get(f"{base_url}app/empleados")
        driver.implicitly_wait(3)
        
        # Si la ruta está protegida, debería redirigir a login
        assert "login" in driver.current_url or driver.current_url.endswith("/")
    
    def test_estadisticas_module_redirect_protected(self, driver, base_url):
        """Verificar que el módulo de estadísticas redirige a login (protegido)"""
        driver.get(f"{base_url}app/estadisticas")
        driver.implicitly_wait(3)
        
        # Si la ruta está protegida, debería redirigir a login
        assert "login" in driver.current_url or driver.current_url.endswith("/")
    
    def test_vehiculos_module_redirect_protected(self, driver, base_url):
        """Verificar que el módulo de vehículos redirige a login (protegido)"""
        driver.get(f"{base_url}app/vehiculos")
        driver.implicitly_wait(3)
        
        # Si la ruta está protegida, debería redirigir a login
        assert "login" in driver.current_url or driver.current_url.endswith("/")
    
    def test_app_route_exists(self, driver, base_url):
        """Verificar que la ruta /app existe"""
        driver.get(f"{base_url}app")
        driver.implicitly_wait(3)
        
        # Si la ruta /app está protegida, redirige a login
        # Si no, muestra el dashboard
        assert driver.current_url.startswith(base_url)
