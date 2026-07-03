# 🐟 Stingray - HTML + CSS + JS + React in ONE file

**Un lenguaje donde todo va junto.** Escribes `.stngr`, obtienes la web.

## Lo más fácil que usarás

```bash
stingray init mi-app     # Crea todo el proyecto
cd mi-app
stingray dev             # Arranca servidor (abre navegador automático)
```

**¿Tienes un archivo `.stngr`?** Solo pasalo directo:

```bash
stingray app.stngr       # Se compila y abre automáticamente
```

## Comandos que importan

| Comando | Qué hace |
|---------|----------|
| `stingray init <nombre>` | Crea proyecto listo para usar |
| `stingray dev` | Servidor dev con hot reload + abre navegador |
| `stingray build` | Compila para producción |
| `stingray compile x.stngr` | Compila un archivo |
| `stingray run x.stngr` | Compila y ejecuta |
| `stingray new component MiBoton` | Crea un componente |
| `stingray new page Inicio` | Crea una página |
| `stingray serve` | Sirve archivos estáticos |

## Atajos

```bash
sr init mi-app        → stingray init mi-app
stngr dev             → stingray dev
sb                    → stingray build
stingray app.stngr    → auto-compila y abre
```

## ¿Qué es un archivo `.stngr`?

Todo en uno. HTML, CSS, JS y React en un solo archivo legible:

```stingray
component Contador {
  state {
    count = 0;
  }

  template {
    <div class="app">
      <h1>Contador: {count}</h1>
      <mdc-button @click="sumar">+ Sumar</mdc-button>
      <mdc-button @click="restar">- Restar</mdc-button>
    </div>
  }

  script {
    function sumar() { count++; }
    function restar() { count--; }
  }

  style {
    .app { text-align: center; padding: 40px; }
    h1 { color: #0066cc; }
  }
}
```

## Instalación

### Opción 1: Instalador automático (recomendado)

```bash
# Instala todo: dependencias, PATH, asociaciones de archivos, VS Code
stingray --install

# O con npm global
npm install -g stingray-lang
```

### Opción 2: Instalador standalone (.exe)

```bash
# Genera el instalador
node bin/installer.js

# Para crear .exe real necesitas:
# Inno Setup: "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" Stingray.iss
# NSIS: makensis Stingray.nsi
```

Genera:
- `Stingray.iss` → Inno Setup (compila a .exe)
- `Stingray.nsi` → NSIS (compila a .exe)
- `Stingray-Installer.bat` → Auto-instalador sin dependencias
- `installer-dist/portable/` → Paquete portable (ZIP)

### Opción 3: Portable (sin instalación)

```bash
node bin/installer.js portable
# Usa: installer-dist/portable/start.bat
```

### Opción 4: Desde npm

```bash
npm install -g stingray-lang
```

## Integración con el sistema

### Windows
- **Asociación de archivos**: doble clic en `.stngr` compila
- **Menú contextual** (clic derecho): Compile, Dev Server, Build
- **Arrastrar y soltar**: arrastra `.stngr` al terminal
- **Scripts rápidos**: `stingray-dev.bat`, `stingray-build.bat`, etc.
- **PATH automático**: `stingray` disponible desde cualquier carpeta
- **Variables de entorno**: `STINGRAY_HOME` configurado

### VS Code
- **Instalación automática** con `stingray --install`
- **Syntax highlighting** para HTML, CSS, JS dentro de `.stngr`
- **40+ snippets** (escribe `stng-btn` + Tab)
- **Errores WUT?** con stack trace completo
- **Autocompletado** para componentes Material Web
- **Validación en tiempo real** al guardar

### Errores "WUT?"

Cuando algo falla, ves exactamente qué:

```
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   WUT?                                               ║
║                                                      ║
╚══════════════════════════════════════════════════════╝

  Full Error Log:
  ─────────────────────────────────────────────────────
    Timestamp:  2026-07-03T...
    File:       app.stngr
    Line:       15:3
    Error:      Unexpected token '}'
    
    Source Context:
      13:   <mdc-button>Submit</mdc-button>
      14: </div>
    > 15: }
      16:
```

## Extensiones de archivo

- **`.stngr`** - Archivo Stingray principal
- **Logo**: `Assets/logo.png`

## Compatible con la web

Stingray se compila a HTML/CSS/JS puro. Todo lo que funciona en la web, funciona con Stingray:

- Libraries npm
- APIs del navegador (fetch, localStorage, etc.)
- Frameworks React/Vue/Angular
- Cualquier CDN

## Estructura de un proyecto

```
mi-app/
├── src/
│   ├── components/    ← Tus componentes (.stngr)
│   ├── pages/         ← Páginas (.stngr)
│   ├── hooks/         ← Hooks personalizados
│   └── styles/        ← Temas y estilos
├── public/            ← Archivos estáticos
├── stingray.json      ← Configuración
└── package.json       ← Paquetes npm
```

## Generar instaladores

```bash
# Generar TODO (Inno Setup + NSIS + Auto-instalador + Portable)
node bin/installer.js

# Generar solo un tipo
node bin/installer.js npm          # Solo paquete npm
node bin/installer.js inno         # Solo Inno Setup
node bin/installer.js nsis         # Solo NSIS
node bin/installer.js self         # Solo auto-instalador
node bin/installer.js portable     # Solo portable

# Ayuda
node bin/installer.js --help
```

## Licencia

MIT
