# Handoff: Sobre mí — "Historia.htm" (rediseño retro Apple/Mac OS)

## Overview
Rediseño del apartado "Sobre mí" del portfolio (actualmente la ventana `#win-about` / `Sobre_mi.txt` en el escritorio `eduardo.OS`). Sustituye el contenido breve actual por una página más completa (bio ampliada, experiencia, skills por categoría, curiosidades quitadas por decisión de producto, CV descargable y un libro de visitas funcional), con una estética "web antigua estilo Apple" (ventana de navegador Mac OS clásica, tipografía serif, colores planos) combinada con interacciones modernas (scroll-reveal, hover, formulario persistente).

## About the Design Files
El archivo `Historia.htm - diseno.dc.html` en esta carpeta es una **referencia de diseño** construida como prototipo HTML — no es código de producción para copiar tal cual. La tarea es **recrear este diseño dentro del motor de ventanas ya existente del portfolio** (`openWin` / `closeWin` / `startDrag` en `src/main.ts`, compilado a `public/dist/main.js`, con el HTML en `public/index.html` y los estilos en `public/styles.css`), reutilizando sus convenciones (clases `.window`, `.titlebar`, `.tbtn`, sistema de iconos del escritorio) en vez de introducir un framework nuevo.

**Decisión de integración a tomar por el desarrollador:** el contenido es largo (mucho más que la ventana `win-about` actual). Dos opciones razonables, elegir la que mejor case con el motor de ventanas:
1. Ampliar `#win-about` a una ventana más grande con scroll interno y meter todo el contenido dentro (más simple, coherente con "una ventana = una app").
2. Crear una ventana nueva (p. ej. `#win-historia`) que se abre desde un enlace/icono dentro de `win-about` (el diseño ya incluye ese patrón: un enlace "« volver a eduardo.OS" para ir hacia atrás), imitando abrir "otra página" dentro del propio sistema operativo simulado — esto es lo que pidió el usuario ("hacer otra página web dentro del propio portfolio").

Dado que el usuario pidió explícitamente "hacer otra página web dentro del propio portfolio" para contar su historia, la opción 2 es la más fiel a la intención original — pero requiere revisar cómo `openWin`/`closeWin` gestionan múltiples ventanas y z-index antes de decidir.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, espaciados y microinteracciones están definidos abajo con precisión — recrear pixel a pixel dentro del sistema de ventanas existente.

## Screens / Views

### Única vista: "Historia.htm"
Ventana de navegador Mac OS clásico (estilo Netscape/IE de los 90 con espíritu Apple), 780px de ancho de contenido dentro de un marco de escritorio de 900px.

**Estructura de arriba a abajo:**

1. **Barra de título** — fondo rayado (`repeating-linear-gradient(180deg,#fff 0 2px,#dfe1e4 2px 4px)`), borde inferior `#9a9fa6`, texto centrado "eduardo.os — Historia", dos cuadraditos de control a los lados (11×11px, borde `#7d828a`, fondo `#eee`). Fuente sans (`'Helvetica Neue', Helvetica, Arial, sans-serif`), 11px, semibold.
2. **Barra de menú** — "File · Edit · Options · Navigate · Hotlist", 11px, gris `#333`, gap 14px, borde inferior `#c7cad0`. Sans-serif.
3. **Barra de herramientas** — botones ◂ / ▸ (bevel: borde `#9a9fa6`, fondo `linear-gradient(180deg,#fff,#d6d9dd)`, radio 4px) + botón ⌂ que enlaza a la sección de libro de visitas, + campo de URL simulado (fondo blanco, borde `#9a9fa6`, radio 9px) mostrando `eduardo.os/historia.html`. Fondo de la barra `#ECEEF0`. Sans-serif.
4. **Hero** — fondo gris claro plano `#F3F4F5` (sin colores ni gradientes — decisión explícita del usuario). Layout flex: columna izquierda con nombre (H1, 30px/800/`#1c222b`), tagline (14px/500/`#555`, máx 34ch) y 5 enlaces de navegación en pila (botones blancos, borde `#d5d7db`, radio 4px, 13px/700, texto `#1c222b`): Sobre mí · Experiencia y estudios · Con qué trabajo · Libro de visitas. Columna derecha: foto de perfil 130×154px, borde 1px `#d5d7db`, sombra sutil.
5. **Contador de visitas** — franja centrada, fondo `#ECEEF0`, texto 10px `#555` "has sido el visitante número [contador] desde 03/09/2026". El número en cápsula oscura (`#1c222b` fondo, texto amarillo `#e9c531`, monoespaciada `'IBM Plex Mono'`, 15px/700, letter-spacing 2px, radio 3px).
6. **Sobre mí** — padding 22×28px. Título "Sobre mí" (18px/800, mayúsculas, `#1c222b`) con efecto glitch al hover (ver Interacciones). Dos párrafos de bio, serif, 14px, line-height 1.65, color `#333`.
7. **Divisor** — barra de 2px con gradiente horizontal de 5 colores: `#3fae54 → #e9c531 → #e07a2c → #d5372f → #8a3a9c`. Se repite entre cada sección.
8. **Experiencia y estudios** — título igual que arriba. Dos tarjetas (borde `#d5d7db`, radio 6px, fondo `#F7F8F9`, padding 10×14px) en columna: fecha destacada a la izquierda (11px/700, color rojo `#d5372f` o morado `#8a3a9c` alternando) + título en negrita (13px) + descripción (12.5px, `#444`).
9. **Con qué trabajo** — título + subtítulo "pasa el ratón por encima" (11px, `#888`). Grid de 2 columnas (etiqueta de categoría 80px + píldoras). 4 categorías: Backend (Python, Java), Web (TypeScript, Angular), Infra (Docker, Producción), IA (IA/LLM, Claude). Píldoras: borde `#d5d7db`, radio 20px (pill), fondo blanco, 12px — al hover invierten a fondo `#1c222b` y texto blanco.
10. **Botón CV** — estilo bevel clásico igual que los botones GitHub/LinkedIn del resto del portfolio: borde 1px `#6b7178`, fondo `linear-gradient(180deg,#fff,#ABB0B6)`, texto `#1c222b`, radio 5px, padding 8×16px, 13px/700. Enlaza a `uploads/CV_Eduardo_Holanda_Fernandez.pdf` (ruta a confirmar contra la ubicación real del PDF en el repo).
11. **Libro de visitas** — fondo `#F7F8F9`. Lista de entradas (máx-height 160px, scroll, fondo blanco, borde `#d5d7db`, radio 6px) — cada entrada: nombre en negrita `#1c222b`, fecha gris 10px, mensaje `#333`. Si no hay entradas: mensaje centrado gris "Aún nadie ha firmado — sé el primero." Formulario debajo (máx 360px): input nombre, textarea mensaje (2 filas), botón "Firmar el libro »" con el mismo estilo bevel clásico que el CV.
12. **Footer** — fondo oscuro `#1c222b`, texto centrado gris claro 11px, copyright + enlaces "volver arriba" / "eduardo.OS" en amarillo `#e9c531`.

**Tipografía general del contenido:** serif (`Georgia, 'Times New Roman', serif`) en todo el cuerpo — deliberado, para el aire retro. Los elementos de "chrome" del navegador (barra de título, menú, toolbar, campo de URL) se quedan en sans-serif (`'Helvetica Neue', Helvetica, Arial, sans-serif`) — es la única excepción.

## Interactions & Behavior
- **Scroll-reveal**: las secciones Sobre mí, Experiencia, Con qué trabajo y Libro de visitas empiezan en `opacity:0; translateY(16px)` y animan a `opacity:1; translateY(0)` en 0.6s ease cuando entran en el viewport (usar `IntersectionObserver`, threshold 0.15, sin repetir la animación al salir/entrar de nuevo).
- **Hover glitch en títulos de sección**: el `<h2>` "Sobre mí" tiene dos copias del texto superpuestas (`position:absolute`, mismo texto), una en rojo `#d5372f` y otra en naranja `#e07a2c`, ambas `opacity:0` por defecto. Al hover del `<h2>`, ambas copias suben a `opacity:.65` y corren una animación CSS de desplazamiento de 2 pasos (`steps(2)`, 0.3s, loop infinito) con offsets de -2px/+2px en distintas direcciones — efecto de aberración cromática breve.
- **Skill tags**: hover invierte colores (fondo blanco→`#1c222b`, texto negro→blanco), transición instantánea vía `:hover`.
- **Libro de visitas (guestbook)**:
  - Al enviar el formulario (con nombre y mensaje no vacíos), se añade `{name, msg, date}` (fecha con `toLocaleDateString('es-ES')`) al principio de la lista y se limpian los campos.
  - Persistencia en `localStorage` bajo la key `eduardoos-hist-guestbook` (array JSON) — debe sobrevivir a recargas de página.
  - Sin backend: es enteramente cliente.
- **Contador de visitas**: al cargar la página, lee `localStorage['eduardoos-hist-hits']` (o arranca en 41000 si no existe), le suma 1, y lo vuelve a guardar — simula un contador de visitas retro pero es real y persistente por navegador.
- **Enlaces de ancla**: los 5 enlaces del hero y el botón ⌂ del toolbar hacen scroll a sus secciones vía `href="#id"` (scroll nativo del navegador, no hace falta JS adicional si las secciones tienen esos ids).

## State Management
- `hits: number | null` — contador de visitas, leído/incrementado en el montaje del componente desde `localStorage`.
- `guestEntries: {name, msg, date}[]` — lista del libro de visitas, leída de `localStorage` al montar.
- `guestName: string`, `guestMsg: string` — valores controlados del formulario.
- `visible: Record<string, boolean>` — qué secciones ya han entrado en el viewport (para el scroll-reveal), rellenado por el `IntersectionObserver`.

## Design Tokens

**Colores**
| Token | Hex | Uso |
| --- | --- | --- |
| Texto principal | `#1c222b` | títulos, texto oscuro |
| Texto cuerpo | `#333` / `#444` | párrafos |
| Texto secundario | `#555` / `#888` / `#999` | subtítulos, metadatos |
| Bordes | `#d5d7db` / `#9a9fa6` / `#7d828a` / `#6b7178` | bordes de tarjetas, chrome, botones bevel |
| Fondo chrome | `#ECEEF0` / `#F3F4F5` / `#F7F8F9` | toolbar, hero, tarjetas |
| Verde | `#3fae54` | divisor, acento |
| Amarillo | `#e9c531` | contador, footer links, divisor |
| Naranja | `#e07a2c` | divisor, glitch |
| Rojo | `#d5372f` | fecha destacada, divisor, glitch |
| Morado | `#8a3a9c` | fecha destacada, divisor |
| Botón bevel | `linear-gradient(180deg,#fff,#ABB0B6)` sobre borde `#6b7178` | CV, submit guestbook, GitHub/LinkedIn (ya existente en el resto del sitio) |

Nota: se descartó deliberadamente cualquier tono azul y cualquier fondo de color detrás de la foto de perfil — decisión de producto tomada durante la revisión.

**Tipografía**
- Contenido: `Georgia, 'Times New Roman', serif`.
- Chrome de navegador (barra de título, menú, toolbar, URL): `'Helvetica Neue', Helvetica, Arial, sans-serif`.
- Contador de visitas: `'IBM Plex Mono', monospace`.
- Tamaños: H1 30px/800, H2 sección 18px/800 mayúsculas, cuerpo 14px/1.65, metadatos 10–11px.

**Espaciado / radios**
- Padding de sección: `22px 28px`.
- Radio de tarjetas/botones: 4–6px (nunca pill excepto las skill tags, 20px).
- Divisor entre secciones: 2px de alto, `margin: 0 28px`.

## Assets
- Foto de perfil: `public/img/foto_perfil/foto_perfil.JPG` (ya existe en el repo).
- CV descargable: `uploads/CV_Eduardo_Holanda_Fernandez.pdf` — ruta placeholder del prototipo; confirmar dónde vive el PDF real en el repo de producción antes de enlazarlo.
- Fuente `IBM Plex Mono`: cargada por Google Fonts en el prototipo; el sitio de producción puede ya tener una fuente monoespaciada equivalente (revisar `public/styles.css`).

## Contenido exacto (copy)
- Tagline: "Backend, infraestructura y automatización con IA — último año de Ingeniería de Computadores"
- Bio (2 párrafos, verbatim):
  1. "Estudiante de último año de Ingeniería de Computadores en la Universidad Rey Juan Carlos, apasionado por el desarrollo de software y la eficiencia operativa. He trabajado como Responsable Técnico en Gextia (Factor Libre), donde gestioné el mantenimiento de servicios backend, despliegues en producción y el desarrollo de herramientas internas integrando modelos de IA como Claude."
  2. "Además de mi perfil backend y de sistemas, cuento con experiencia sólida desarrollando aplicaciones web (TypeScript, Angular) y una gran vocación por el trabajo en equipo y el soporte técnico — reflejada en proyectos como un vigilante de seguridad multiplataforma, una plataforma de salud, fractales concurrentes y algún clásico reconstruido desde cero."
- Experiencia: "Responsable Técnico — Gextia (Factor Libre)" (mayo — agosto 2026), "Ingeniería de Computadores — Universidad Rey Juan Carlos" (último año, sistemas/concurrencia/ciberseguridad).
- Skills: Backend (Python, Java) · Web (TypeScript, Angular) · Infra (Docker, Producción) · IA (IA/LLM, Claude).
- Nota: la sección de curiosidades personales ("Me gusta el baloncesto", "Escalo", "Estoy desarrollando un videojuego") se descartó en la última revisión — no incluir.

## Files
- `Historia.htm - diseno.dc.html` — prototipo HTML completo con el diseño final (única fuente de verdad visual; ábrelo en el navegador para ver todos los estados y el comportamiento del hover/scroll-reveal en vivo).
- En el repo de producción: `public/index.html` (ventana `#win-about` y sistema de iconos del escritorio), `public/styles.css` (clases `.window`, `.titlebar`, `.tbtn`), `src/main.ts` (funciones `openWin`/`closeWin`/`startDrag` — el motor de ventanas al que hay que enganchar esta pantalla).
