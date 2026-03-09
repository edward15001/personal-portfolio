# Personal Portfolio

Portfolio personal con diseño brutalista, estética cyberpunk y temática técnica de alto contraste (inspirado en la interfaz tipo consola/juego clásico como *Marathon*).

![HTML](https://img.shields.io/badge/HTML5-0a0a0a?style=flat&logo=html5)
![CSS](https://img.shields.io/badge/CSS3-0a0a0a?style=flat&logo=css3&logoColor=2965f1)
![TypeScript](https://img.shields.io/badge/TypeScript-0a0a0a?style=flat&logo=typescript)

## Características del Diseño
* **Tipografías:** `Space Grotesk` (primaria) y `JetBrains Mono` (interfaz técnica).
* **Paleta Brutalista:** Fondo completamente negro (`#000000`), verde/neón de acento (`#ccff00`) y grises técnicos.
* **Layouts Angulares:** Radios de borde rígidos (`0px`), sombras duras y botones de alto contraste.
* **Efectos:** Cuadrículas pseudo-científicas, metadatos en pantalla y tipografía mayúscula masiva.

## Estructura

```text
├── public/                 # Archivos estáticos (servidos por Vercel)
│   ├── index.html          # Página principal
│   ├── project-nutrovia.html
│   ├── project-angular.html
│   ├── project-tfg.html
│   ├── project-minesweeper.html
│   ├── project-mandelbrot.html
│   ├── styles.css          # Estilos: brutalismo, grids, variables de color
│   ├── img/                # Imágenes de los proyectos y mockups generados
│   └── dist/
│       └── main.js         # JavaScript compilado
├── src/
│   └── main.ts             # Lógica de TypeScript (Scroll effects, animaciones)
├── vercel.json             # Configuración de despliegue Vercel
├── tsconfig.json           # Configuración TypeScript
└── package.json            # Scripts y dependencias
```