# Guía Rápida - Pruebas E2E con Selenium

## ⚙️ Configuración Inicial

### 1. Variables de Entorno
Crea un archivo `.env` en `backend/`:

```bash
FRONTEND_URL=https://aquawash.pages.dev/
API_URL=http://localhost:8000
HEADLESS=false
```

### 2. Instalar Dependencias
Ya están instaladas. Para verificar:
```bash
pip list | grep -E "selenium|pytest|webdriver"
```

## 🚀 Ejecutar Pruebas

### Forma Rápida
```bash
# Todas las pruebas
cd backend
pytest tests/e2e/ -v

# Solo login
pytest tests/e2e/test_login.py -v

# Solo navegación
pytest tests/e2e/test_navigation.py -v
```

### Forma Avanzada
```bash
# Solo Chrome
pytest tests/e2e/ -k "chrome" -v

# Modo headless (sin ventana del navegador)
$env:HEADLESS="true"; pytest tests/e2e/ -v

# En paralelo (más rápido)
pytest tests/e2e/ -n auto

# Con reporte HTML
pytest tests/e2e/ --html=report.html --self-contained-html
```

## 📁 Estructura

```
backend/
├── tests/
│   ├── conftest.py                 # Config global
│   ├── e2e/
│   │   ├── conftest.py            # Config de Selenium
│   │   ├── test_login.py          # Pruebas de login
│   │   ├── test_navigation.py     # Pruebas de navegación
│   │   ├── test_modulos.py        # Pruebas de módulos
│   │   └── README.md              # Documentación completa
├── pytest.ini                      # Configuración de pytest
└── requirements.txt                # Dependencias (actualizado)
```

## ✅ Características

✓ **3 navegadores**: Chrome, Firefox, Edge  
✓ **Modo headless** para CI/CD  
✓ **Ejecución paralela** con pytest-xdist  
✓ **Helpers reutilizables** para Selenium  
✓ **Esperas inteligentes** (no Sleep!)  
✓ **Fixtures predefinidas** para agilizar desarrollo  

## 🐛 Troubleshooting

### Error: "No module named 'selenium'"
```bash
pip install selenium webdriver-manager
```

### Las pruebas van lentamente en Vercel
```bash
$env:HEADLESS="true"
pytest tests/e2e/ -n auto -v
```

### No encuentra elementos
- Verifica los selectores CSS/XPath
- Usa `helper.wait_for_element()` en lugar de búsquedas directas
- Aumenta timeouts en necesario

## 📚 Documentación Completa

Ver [`backend/tests/e2e/README.md`](./backend/tests/e2e/README.md) para:
- Ejemplos avanzados
- Lista completa de fixtures
- Integración con CI/CD
- Best practices
