# Pruebas E2E con Selenium

Esta carpeta contiene las pruebas end-to-end automatizadas usando Selenium WebDriver.

## Instalación

1. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configurar variables de entorno** (crear `.env` en la raíz del proyecto):
   ```
   FRONTEND_URL=https://aquawash.pages.dev/
   API_URL=http://localhost:8000
   HEADLESS=false
   ```

## Ejecutar Pruebas

### Ejecutar todas las pruebas
```bash
pytest tests/e2e/ -v
```

### Ejecutar pruebas de un módulo específico
```bash
pytest tests/e2e/test_login.py -v
pytest tests/e2e/test_navigation.py -v
pytest tests/e2e/test_modulos.py -v
```

### Ejecutar solo pruebas de un navegador específico
```bash
pytest tests/e2e/ -k "chrome" -v
pytest tests/e2e/ -k "firefox" -v
```

### Modo headless (sin interfaz gráfica)
```bash
HEADLESS=true pytest tests/e2e/ -v
```

### Ejecutar en paralelo (más rápido)
```bash
pytest tests/e2e/ -n auto
```

### Con más detalles de ejecución
```bash
pytest tests/e2e/ -vv -s
```

### Generar reporte HTML
```bash
pytest tests/e2e/ --html=reports/report.html --self-contained-html
```

## Estructura de Pruebas

```
tests/
├── conftest.py                  # Configuración global de pytest
├── e2e/
│   ├── conftest.py             # Configuración de Selenium
│   ├── __init__.py
│   ├── test_login.py           # Pruebas de autenticación
│   ├── test_navigation.py      # Pruebas de navegación
│   └── test_modulos.py         # Pruebas de módulos específicos
```

## Navegadores Soportados

- **Chrome** (configuración por defecto)
- **Firefox** (Gecko)
- **Edge** (Chromium)

Por defecto, las pruebas se ejecutan en los 3 navegadores. Para ejecutar en uno específico:

```bash
pytest tests/e2e/ -k "not firefox and not edge"  # Solo Chrome
```

## Fixtures Disponibles

### `driver`
WebDriver parametrizado para cada navegador.

```python
def test_example(driver):
    driver.get("https://example.com")
```

### `helper`
Clase con métodos auxiliares comunes.

```python
def test_example(helper):
    helper.send_keys((By.ID, "email"), "test@example.com")
    helper.click_element((By.ID, "submit"))
```

### `wait`
WebDriverWait configurado (timeout 10s).

```python
def test_example(wait):
    element = wait.until(EC.presence_of_element_located((By.ID, "element")))
```

### `base_url`
URL base de la aplicación desde `.env`.

```python
def test_example(driver, base_url):
    driver.get(base_url + "login")
```

## Ejemplos de Uso

### Prueba simple de navegación
```python
from selenium.webdriver.common.by import By

def test_navigate_to_login(driver, base_url, helper):
    driver.get(base_url)
    login_link = helper.wait_for_element((By.XPATH, "//a[@href*='login']"))
    login_link.click()
    assert "login" in driver.current_url
```

### Prueba con espera explícita
```python
from selenium.webdriver.support import expected_conditions as EC

def test_form_submission(driver, base_url, wait, helper):
    driver.get(f"{base_url}form")
    
    # Rellenar formulario
    helper.send_keys((By.ID, "email"), "test@example.com")
    helper.send_keys((By.ID, "password"), "password123")
    
    # Hacer submit
    helper.click_element((By.CSS_SELECTOR, "button[type='submit']"))
    
    # Esperar a redirección
    wait.until(EC.url_contains("/dashboard"))
```

## Troubleshooting

### Error: "Chrome driver not found"
```bash
pip install --upgrade webdriver-manager
```

### Pruebas lentas en Vercel
- Aumentar `timeout` en `pytest.ini`
- Usar `HEADLESS=true` para reducir recursos
- Ejecutar con `-n auto` para paralelizar

### Element not found
- Verificar selectores CSS/XPath
- Aumentar `implicitly_wait()` en conftest
- Usar `helper.wait_for_element()` en lugar de búsquedas directas

## CI/CD Integration

Para integración con CI/CD (GitHub Actions, GitLab CI, etc.):

```yaml
# .github/workflows/test.yml
- name: Run E2E Tests
  run: |
    HEADLESS=true pytest tests/e2e/ -v --html=report.html
```

## Tips de Mejores Prácticas

1. **Usar relative locators** cuando sea posible
2. **Evitar sleep()**, usar esperas explícitas
3. **Limpiar datos de prueba** después de cada test
4. **Usar fixtures** para reutilizar código
5. **Separar tests** por funcionalidad
6. **Documentar selectores** complejos
