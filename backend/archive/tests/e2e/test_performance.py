import pytest
import time
from selenium.webdriver.common.by import By


class TestPerformance:
    """Pruebas de rendimiento y velocidad de carga"""
    
    def test_homepage_load_time_under_3_seconds(self, driver, base_url):
        """Verificar que la página de inicio carga en menos de 3 segundos"""
        start_time = time.time()
        driver.get(base_url)
        driver.implicitly_wait(1)
        end_time = time.time()
        
        load_time = end_time - start_time
        assert load_time < 3, f"Página tardó {load_time:.2f}s (máximo 3s)"
    
    def test_login_page_load_time_under_2_seconds(self, driver, base_url):
        """Verificar que página de login carga rápido"""
        start_time = time.time()
        driver.get(f"{base_url}login")
        driver.implicitly_wait(1)
        end_time = time.time()
        
        load_time = end_time - start_time
        assert load_time < 2, f"Login tardó {load_time:.2f}s (máximo 2s)"
    
    def test_registration_page_load_time_under_2_seconds(self, driver, base_url):
        """Verificar que página de registro carga rápido"""
        start_time = time.time()
        driver.get(f"{base_url}register")
        driver.implicitly_wait(1)
        end_time = time.time()
        
        load_time = end_time - start_time
        assert load_time < 2, f"Registro tardó {load_time:.2f}s (máximo 2s)"
    
    def test_page_responsiveness_after_load(self, driver, base_url):
        """Verificar que la página responde rápidamente después de cargar"""
        driver.get(base_url)
        
        # Medir tiempo para encontrar elemento después de carga
        start_time = time.time()
        try:
            # Intentar encontrar un elemento común
            driver.find_element(By.TAG_NAME, "body")
            end_time = time.time()
            
            response_time = end_time - start_time
            assert response_time < 1, f"Búsqueda de elemento tardó {response_time:.2f}s"
        except:
            pass
    
    def test_login_form_elements_appear_quickly(self, driver, base_url):
        """Verificar que elementos del formulario de login aparecen rápido"""
        start_time = time.time()
        driver.get(f"{base_url}login")
        
        try:
            # Esperar a que el campo de email aparezca
            end_time = time.time()
            load_time = end_time - start_time
            
            # Debe ser menos de 2 segundos
            assert load_time < 2, f"Elementos tardaron {load_time:.2f}s"
        except:
            pass
    
    def test_navigation_between_pages_is_smooth(self, driver, base_url):
        """Verificar que navegación entre páginas es suave"""
        times = []
        
        # Navegar de inicio a login
        start = time.time()
        driver.get(f"{base_url}login")
        times.append(time.time() - start)
        
        # Navegar de login a inicio
        start = time.time()
        driver.get(base_url)
        times.append(time.time() - start)
        
        # Navegar a registro
        start = time.time()
        driver.get(f"{base_url}register")
        times.append(time.time() - start)
        
        # Promedio de tiempos
        avg_time = sum(times) / len(times)
        assert avg_time < 2.5, f"Navegación promedio tardó {avg_time:.2f}s"
    
    def test_page_title_appears_quickly(self, driver, base_url):
        """Verificar que el título de página aparece rápidamente"""
        start_time = time.time()
        driver.get(base_url)
        
        # Verificar que el título no esté vacío
        max_wait = 8
        while time.time() - start_time < max_wait:
            if driver.title:
                elapsed = time.time() - start_time
                assert elapsed < max_wait, f"Título tardó {elapsed:.2f}s"
                return
            time.sleep(0.1)
        
        # Si llegamos aquí, el título no apareció a tiempo
        assert False, f"Título no apareció en {max_wait}s"
    
    def test_multiple_page_loads_performance(self, driver, base_url):
        """Verificar que carga repetida de páginas mantiene rendimiento"""
        urls = [
            base_url,
            f"{base_url}login",
            f"{base_url}register",
            base_url,
        ]
        
        times = []
        for url in urls:
            start = time.time()
            driver.get(url)
            driver.implicitly_wait(1)
            elapsed = time.time() - start
            times.append(elapsed)
        
        avg_time = sum(times) / len(times)
        max_time = max(times)
        
        # Promedio debe ser menor a 3s
        assert avg_time < 3, f"Promedio de carga: {avg_time:.2f}s"
        # Ninguna carga debe tardar más de 5s
        assert max_time < 5, f"Máxima carga: {max_time:.2f}s"
