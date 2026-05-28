#!/usr/bin/env python3
"""
Script para ejecutar pruebas E2E con opciones comunes
Uso: python run_tests.py [opciones]
"""

import subprocess
import sys
import os
from pathlib import Path


def run_command(cmd):
    """Ejecutar comando y mostrar salida"""
    print(f"\n{'='*60}")
    print(f"Ejecutando: {' '.join(cmd)}")
    print(f"{'='*60}\n")
    
    result = subprocess.run(cmd)
    return result.returncode


def main():
    os.chdir(Path(__file__).parent)
    
    if len(sys.argv) < 2:
        print("Uso: python run_tests.py [opción]")
        print("\nOpciones:")
        print("  all              - Ejecutar todas las pruebas")
        print("  login            - Solo pruebas de login")
        print("  navigation       - Solo pruebas de navegación")
        print("  modules          - Solo pruebas de módulos")
        print("  chrome           - Solo en Chrome")
        print("  firefox          - Solo en Firefox")
        print("  edge             - Solo en Edge")
        print("  headless         - Modo headless (sin GUI)")
        print("  parallel         - Ejecutar en paralelo")
        print("  report           - Generar reporte HTML")
        sys.exit(1)
    
    option = sys.argv[1].lower()
    
    base_cmd = ["pytest", "tests/e2e/", "-v"]
    
    if option == "all":
        cmd = base_cmd
    elif option == "login":
        cmd = base_cmd + ["-k", "TestLogin"]
    elif option == "navigation":
        cmd = base_cmd + ["-k", "TestNavigation"]
    elif option == "modules":
        cmd = base_cmd + ["-k", "TestModulos"]
    elif option == "chrome":
        cmd = base_cmd + ["-k", "chrome"]
    elif option == "firefox":
        cmd = base_cmd + ["-k", "firefox"]
    elif option == "edge":
        cmd = base_cmd + ["-k", "edge"]
    elif option == "headless":
        os.environ["HEADLESS"] = "true"
        cmd = base_cmd
    elif option == "parallel":
        cmd = base_cmd + ["-n", "auto"]
    elif option == "report":
        cmd = base_cmd + ["--html=report.html", "--self-contained-html"]
    else:
        print(f"Opción desconocida: {option}")
        sys.exit(1)
    
    exit_code = run_command(cmd)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
