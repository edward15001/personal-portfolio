# eduardo.OS

Portfolio personal en forma de **escritorio retro** (estética años 90 con alma
de terminal): pantalla de arranque, iconos de escritorio, ventanas arrastrables
con barra de tareas, un navegador falso con una pestaña por proyecto y un
terminal con comandos reales (`help`, `whoami`, `projects`, `open <proyecto>`...).
Accesible desde [aquí](https://www.eduardo-projects.es/)

![HTML](https://img.shields.io/badge/HTML5-0a0a0a?style=flat&logo=html5)
![CSS](https://img.shields.io/badge/CSS3-0a0a0a?style=flat&logo=css3&logoColor=2965f1)
![TypeScript](https://img.shields.io/badge/TypeScript-0a0a0a?style=flat&logo=typescript)

## Características del Diseño

* **Tipografías:** `Press Start 2P` (chrome pixel-art) y `IBM Plex Mono` (cuerpo de texto/terminal).
* **Paleta:** Fondo azul-noche con scanlines y viñeta CRT, acento verde terminal (`#39FF88`),
  chrome gris de ventana estilo Windows 9x, y un tema de color distinto por proyecto
  (verde hacker, papel cálido con savia para NutroVia, azul corporativo, púrpura computacional,
  amarillo hazard).
* **Identidades visuales:** dentro de PROYECTOS.EXE, cada proyecto documenta su identidad visual
  (paleta, tipografía, iconografía...) con muestras de color en la página. NutroVia es la primera
  con su sistema completo (`public/visual-identity/`), cuyo PDF también se puede descargar desde
  la ventana Recursos.
* **Ventanas:** gestor de ventanas propio (abrir/cerrar/minimizar/enfocar/arrastrar) con
  Pointer Events, barra de tareas con pestañas de las ventanas abiertas y reloj.
* **Móvil:** por debajo de 860px las ventanas se abren a pantalla completa (sin arrastre)
  y las pestañas de proyectos hacen scroll horizontal.

## Formulario de contacto (Web3Forms)

La ventana `CONTACTO.EXE` incluye un formulario cuyos mensajes llegan a tu email
mediante [Web3Forms](https://web3forms.com) (gratis, sin base de datos). Incluye
un campo oculto honeypot anti-spam.

### Configuración

1. Entra en [web3forms.com](https://web3forms.com) e introduce tu email para
   recibir tu **Access Key** (gratis, en unos segundos).
2. Pega la clave en `public/contact-config.js`:

   ```js
   window.WEB3FORMS_ACCESS_KEY = "9f3b2a1c-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
   ```

3. Despliega (Vercel) y prueba el formulario: cada envío te llegará al email
   que registraste en Web3Forms.

## Estructura

```text
├── public/                 # Archivos estáticos (servidos por Vercel)
│   ├── index.html          # Escritorio, ventanas, iconos y taskbar
│   ├── contact-config.js   # Access key de Web3Forms (formulario de contacto)
│   ├── styles.css          # Chrome de ventanas, temas por proyecto, responsive
│   ├── img/                # Imágenes de los proyectos y mockups generados
│   ├── visual-identity/    # Identidades visuales de los proyectos (PDFs)
│   └── dist/
│       └── main.js         # JavaScript compilado
├── src/
│   └── main.ts             # Gestor de ventanas, terminal, navegador de proyectos, contacto
├── vercel.json             # Configuración de despliegue Vercel
├── tsconfig.json           # Configuración TypeScript
└── package.json            # Scripts y dependencias
```
