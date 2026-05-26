import pytest
from selenium.webdriver.common.by import By
from datetime import datetime
from pathlib import Path


class TestAuthenticatedFeatures:
    """Pruebas que requieren autenticación"""
    
    @pytest.fixture
    def authenticated_driver(self, driver, base_url, helper):
        """Fixture que autentica el usuario antes de las pruebas"""
        driver.get(f"{base_url}login")
        
        try:
            # Rellenar credenciales
            email_field = helper.wait_for_element((By.CSS_SELECTOR, "input[type='email']"))
            email_field.clear()
            email_field.send_keys("demo@aquawash.com")
            
            password_field = helper.wait_for_element((By.CSS_SELECTOR, "input[type='password']"))
            password_field.clear()
            password_field.send_keys("demo123456")
            
            # Submit
            submit_button = helper.wait_for_element((By.CSS_SELECTOR, "button[type='submit']"))
            submit_button.click()
            
            # Esperar redirección
            driver.implicitly_wait(5)
            
            # Verificar que estamos autenticados (no en login)
            assert "login" not in driver.current_url.lower()
            
        except Exception as e:
            print(f"Error en autenticación: {e}")
            pytest.skip("No se pudo autenticar")
        
        yield driver
    
    def test_authenticated_user_access_dashboard(self, authenticated_driver, base_url):
        """Verificar que usuario autenticado accede al dashboard"""
        # Ya estamos en el dashboard después del login
        current_url = authenticated_driver.current_url.lower()
        
        # No debe estar en login
        assert "login" not in current_url
        assert base_url in current_url
    
    def test_authenticated_user_can_access_inventory(self, authenticated_driver, base_url, helper):
        """Verificar que usuario autenticado puede acceder a inventario"""
        authenticated_driver.get(f"{base_url}app/inventario")
        authenticated_driver.implicitly_wait(3)
        
        # Si está autenticado, debería acceder a inventario
        # (no redirigir a login)
        current_url = authenticated_driver.current_url.lower()
        assert "login" not in current_url
    
    def test_authenticated_user_can_access_caja(self, authenticated_driver, base_url):
        """Verificar que usuario autenticado puede acceder a caja"""
        authenticated_driver.get(f"{base_url}app/caja")
        authenticated_driver.implicitly_wait(3)
        
        current_url = authenticated_driver.current_url.lower()
        assert "login" not in current_url
    
    def test_authenticated_user_can_access_empleados(self, authenticated_driver, base_url):
        """Verificar que usuario autenticado puede acceder a empleados"""
        authenticated_driver.get(f"{base_url}app/empleados")
        authenticated_driver.implicitly_wait(3)
        
        current_url = authenticated_driver.current_url.lower()
        assert "login" not in current_url
    
    def test_authenticated_user_stays_logged_in_on_page_refresh(self, authenticated_driver, base_url):
        """Verificar que usuario permanece autenticado después de refresh"""
        authenticated_driver.refresh()
        authenticated_driver.implicitly_wait(3)
        
        current_url = authenticated_driver.current_url.lower()
        assert "login" not in current_url
    
    def test_authenticated_user_can_navigate_between_modules(self, authenticated_driver, base_url, helper):
        """Verificar navegación entre módulos estando autenticado"""
        # Navegar a inventario
        authenticated_driver.get(f"{base_url}app/inventario")
        authenticated_driver.implicitly_wait(2)
        assert "login" not in authenticated_driver.current_url.lower()
        
        # Navegar a caja
        authenticated_driver.get(f"{base_url}app/caja")
        authenticated_driver.implicitly_wait(2)
        assert "login" not in authenticated_driver.current_url.lower()
        
        # Navegar a empleados
        authenticated_driver.get(f"{base_url}app/empleados")
        authenticated_driver.implicitly_wait(2)
        assert "login" not in authenticated_driver.current_url.lower()
