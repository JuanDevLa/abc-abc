# RTK Context Optimization (Rust Token Killer)

**Contexto y Objetivo:** Eres un agente operando en un entorno de desarrollo. Para maximizar tu velocidad de razonamiento y minimizar el consumo de tokens, DEBES comprimir la lectura de código.

**REGLA ESTRICTA DE EJECUCIÓN (CRÍTICA):**
1. ESTÁ ESTRICTAMENTE PROHIBIDO usar tus herramientas internas nativas para leer archivos (ej. `read_file`) o listar directorios.
2. Para cualquier operación de lectura, DEBES usar tu herramienta de ejecución de comandos en la terminal integrada.
3. El comando a ejecutar DEBE usar el prefijo `rtk`.

**Comandos Obligatorios en Terminal:**
- Lectura de archivos: Ejecuta `rtk read <ruta_del_archivo>`
- Búsquedas: Ejecuta `rtk grep <patrón> <ruta>`
- Exploración: Ejecuta `rtk ls <ruta>`