# 🖤 Personal Portfolio

Portfolio personal minimalista con tema oscuro, efecto glass-text estilo Apple y acento verde lima.

![HTML](https://img.shields.io/badge/HTML5-0a0a0a?style=flat&logo=html5)
![CSS](https://img.shields.io/badge/CSS3-0a0a0a?style=flat&logo=css3&logoColor=2965f1)
![TypeScript](https://img.shields.io/badge/TypeScript-0a0a0a?style=flat&logo=typescript)

## 🚀 Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/personal-portfolio.git
cd personal-portfolio

# 2. Instalar dependencias
npm install

# 3. Compilar TypeScript
npm run build

# 4. Abrir en el navegador
# Opción A — directamente:
start index.html

# Opción B — con servidor local:
npx -y http-server . -p 8080
# Abre http://localhost:8080
```

## 📁 Estructura

```
├── index.html          # Página principal
├── styles.css          # Tema oscuro + glass-text + animaciones
├── src/
│   └── main.ts         # TypeScript fuente
├── dist/
│   └── main.js         # JavaScript compilado
├── tsconfig.json       # Configuración TypeScript
└── package.json        # Scripts y dependencias
```

## 🛠️ Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compila TypeScript → `dist/main.js` |
| `npm run watch` | Compila en modo watch (auto-recompila al guardar) |

## ✏️ Personalización

1. **Nombre y bio** — Edita el hero y la sección "Sobre mí" en `index.html`
2. **Proyectos** — Modifica las tarjetas en `<section id="projects">`
3. **Imágenes** — Reemplaza los iconos SVG placeholder por capturas de tus proyectos
4. **Links** — Actualiza los enlaces de GitHub, LinkedIn y email
5. **Color de acento** — Cambia `--accent` en `styles.css` (por defecto `#b8ff57`)

## 📄 Licencia

MIT
