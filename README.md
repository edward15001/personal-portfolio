# Personal Portfolio

Portfolio personal con estética oscura brutalista y acento verde menta, con una
experiencia **scroll-driven**: hero animado letra a letra, marquee infinito,
secciones numeradas y un showcase de proyectos a pantalla completa con secciones
fijadas (pinned) mientras haces scroll. Accesible desde [aquí](https://www.eduardo-projects.es/)

![HTML](https://img.shields.io/badge/HTML5-0a0a0a?style=flat&logo=html5)
![CSS](https://img.shields.io/badge/CSS3-0a0a0a?style=flat&logo=css3&logoColor=2965f1)
![TypeScript](https://img.shields.io/badge/TypeScript-0a0a0a?style=flat&logo=typescript)
![GSAP](https://img.shields.io/badge/GSAP-0a0a0a?style=flat&logo=greensock)

## Características del Diseño

* **Tipografías:** `Space Grotesk` (primaria) y `JetBrains Mono` (interfaz técnica).
* **Paleta:** Fondo oscuro con matiz verdoso (`#070907`), acento verde menta suave (`#7ee08f`) y grises técnicos.
* **Layouts Angulares:** Radios de borde rígidos (`0px`), sombras duras y botones de alto contraste.
* **Interacciones:** Smooth scroll (Lenis), animaciones de scroll con GSAP + ScrollTrigger,
  letras del hero con máscara, contadores animados, palabras de los títulos con revelado
  y efecto hover, parallax en las imágenes y barra de progreso de scroll.

## Stack de animación

* **GSAP + ScrollTrigger** y **Lenis** se cargan por CDN en `index.html`.
  Si fallan (sin conexión), la página funciona igual: el contenido nunca queda oculto
  y se usan fade-ins con `IntersectionObserver` como mejora progresiva.
* Se respeta `prefers-reduced-motion`.

## Formulario de contacto (Web3Forms)

El botón "Escríbeme" abre un modal con un formulario cuyos mensajes llegan a tu
email mediante [Web3Forms](https://web3forms.com) (gratis, sin base de datos).
Incluye un campo oculto honeypot anti-spam.

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
│   ├── index.html          # Página principal
│   ├── contact-config.js   # Access key de Web3Forms (formulario de contacto)
│   ├── project-nutrovia.html
│   ├── project-angular.html
│   ├── project-safegram.html
│   ├── project-minesweeper.html
│   ├── project-mandelbrot.html
│   ├── styles.css          # Sistema de diseño (tokens, hero, showcase, modal)
│   ├── img/                # Imágenes de los proyectos y mockups generados
│   └── dist/
│       └── main.js         # JavaScript compilado
├── src/
│   └── main.ts             # Lógica: GSAP/ScrollTrigger/Lenis + modal Web3Forms
├── vercel.json             # Configuración de despliegue Vercel
├── tsconfig.json           # Configuración TypeScript
└── package.json            # Scripts y dependencias
```
