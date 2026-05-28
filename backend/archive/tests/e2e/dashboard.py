"""
Panel de Control para Pruebas E2E con Selenium
Script interactivo para ejecutar pruebas de manera fácil
"""

import subprocess
import sys
from pathlib import Path
from datetime import datetime


class Colors:
    """Colores para la terminal"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'


def print_header():
    """Mostrar encabezado del panel"""
    print(f"""
{Colors.BOLD}{Colors.CYAN}
╔════════════════════════════════════════════════════════════╗
║        🧪 PANEL DE CONTROL - PRUEBAS SELENIUM E2E         ║
║                 AquaWash Testing Suite                     ║
╚════════════════════════════════════════════════════════════╝
{Colors.END}
""")


def print_menu():
    """Mostrar menú de opciones"""
    print(f"""
{Colors.BOLD}Selecciona una opción:{Colors.END}

{Colors.GREEN}Pruebas Rápidas:{Colors.END}
  1. Login (todas las pruebas de autenticación)
  2. Navegación (flujo de navegación del sitio)
  3. Módulos (acceso a Caja, Inventario, etc)

{Colors.BLUE}Pruebas por Navegador:{Colors.END}
  4. Solo Chrome
  5. Solo Firefox
  6. Solo Edge

{Colors.YELLOW}Pruebas Avanzadas:{Colors.END}
  7. Todas las pruebas (3 navegadores)
  8. Modo Headless (sin GUI)
  9. Ejecución paralela (más rápido)

{Colors.CYAN}Reportes:{Colors.END}
  10. Generar reporte HTML
  11. Ver último reporte

{Colors.RED}Otros:{Colors.END}
  12. Verificar configuración
  13. Ver logs
  0. Salir

{Colors.BOLD}Opción:{Colors.END} """)


def run_pytest(args):
    """Ejecutar pytest con argumentos"""
    cmd = ["pytest", "tests/e2e/"] + args
    print(f"\n{Colors.BLUE}Ejecutando: {' '.join(cmd)}{Colors.END}\n")
    subprocess.run(cmd)


def main():
    """Menú principal"""
    os_path = Path(__file__).parent
    
    while True:
        print_header()
        print_menu()
        
        try:
            choice = input().strip()
            
            if choice == "0":
                print(f"\n{Colors.GREEN}¡Hasta luego!{Colors.END}\n")
                break
            
            elif choice == "1":
                print(f"\n{Colors.CYAN}▶ Ejecutando pruebas de LOGIN{Colors.END}\n")
                run_pytest(["test_login.py", "-v"])
            
            elif choice == "2":
                print(f"\n{Colors.CYAN}▶ Ejecutando pruebas de NAVEGACIÓN{Colors.END}\n")
                run_pytest(["test_navigation.py", "-v"])
            
            elif choice == "3":
                print(f"\n{Colors.CYAN}▶ Ejecutando pruebas de MÓDULOS{Colors.END}\n")
                run_pytest(["test_modulos.py", "-v"])
            
            elif choice == "4":
                print(f"\n{Colors.CYAN}▶ Ejecutando pruebas solo en CHROME{Colors.END}\n")
                run_pytest(["-k", "chrome", "-v"])
            
            elif choice == "5":
                print(f"\n{Colors.CYAN}▶ Ejecutando pruebas solo en FIREFOX{Colors.END}\n")
                run_pytest(["-k", "firefox", "-v"])
            
            elif choice == "6":
                print(f"\n{Colors.CYAN}▶ Ejecutando pruebas solo en EDGE{Colors.END}\n")
                run_pytest(["-k", "edge", "-v"])
            
            elif choice == "7":
                print(f"\n{Colors.CYAN}▶ Ejecutando TODAS las pruebas{Colors.END}\n")
                run_pytest(["-v", "--tb=short"])
            
            elif choice == "8":
                print(f"\n{Colors.CYAN}▶ Ejecutando en modo HEADLESS (sin navegador visual){Colors.END}\n")
                import os
                os.environ["HEADLESS"] = "true"
                run_pytest(["-v"])
            
            elif choice == "9":
                print(f"\n{Colors.CYAN}▶ Ejecutando en PARALELO (más rápido){Colors.END}\n")
                run_pytest(["-n", "auto", "-v"])
            
            elif choice == "10":
                print(f"\n{Colors.CYAN}▶ Generando reporte HTML{Colors.END}\n")
                run_pytest(["--html=report.html", "--self-contained-html", "-v"])
                print(f"\n{Colors.GREEN}✓ Reporte generado en: report.html{Colors.END}\n")
            
            elif choice == "11":
                print(f"\n{Colors.CYAN}▶ Abriendo último reporte{Colors.END}\n")
                report_file = os_path / "report.html"
                if report_file.exists():
                    subprocess.run([str(report_file)], shell=True)
                else:
                    print(f"{Colors.YELLOW}No hay reporte HTML generado. Ejecuta la opción 10 primero.{Colors.END}")
            
            elif choice == "12":
                print(f"\n{Colors.CYAN}▶ Verificando configuración{Colors.END}\n")
                subprocess.run(["python", "verify_selenium.py"])
            
            elif choice == "13":
                print(f"\n{Colors.CYAN}▶ Últimos logs{Colors.END}\n")
                log_file = os_path / "tests" / "logs" / "pytest.log"
                if log_file.exists():
                    with open(log_file) as f:
                        lines = f.readlines()
                        for line in lines[-50:]:
                            print(line.rstrip())
                else:
                    print(f"{Colors.YELLOW}No hay logs disponibles.{Colors.END}")
            
            else:
                print(f"{Colors.RED}Opción no válida. Intenta de nuevo.{Colors.END}\n")
            
            input(f"\n{Colors.YELLOW}Presiona Enter para continuar...{Colors.END}")
        
        except KeyboardInterrupt:
            print(f"\n\n{Colors.RED}Cancelado.{Colors.END}\n")
            break
        except Exception as e:
            print(f"{Colors.RED}Error: {e}{Colors.END}\n")


if __name__ == "__main__":
    main()
