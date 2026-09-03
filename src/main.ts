/**
 * eduardo.OS — retro desktop portfolio
 * Window manager (open/close/focus/drag via Pointer Events), a project
 * "browser" with per-project tabs/themes, a small command terminal, and the
 * Web3Forms contact form — all inside a fake 90s desktop shell. Drag is
 * disabled below the mobile breakpoint, where windows go full-screen (see
 * styles.css @media rules); the JS here just has to avoid fighting that.
 */

(() => {
  const MOBILE_QUERY = '(max-width: 860px)';
  const isMobile = (): boolean => window.matchMedia(MOBILE_QUERY).matches;

  /* ————————————————————— boot sequence ————————————————————— */
  window.addEventListener('load', () => {
    const boot = document.getElementById('boot');
    window.setTimeout(() => {
      boot?.classList.add('hide');
      openWin('win-about');
    }, 2000);
  });

  /* ————————————————————— clock ————————————————————— */
  const tick = (): void => {
    const clock = document.getElementById('clock');
    if (!clock) return;
    clock.textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };
  tick();
  window.setInterval(tick, 30_000);

  /* ————————————————————— window manager ————————————————————— */
  let zTop = 10;
  const openWins: string[] = [];

  /* Windows without a desktop icon (opened only from the menu bar) still need
     an icon for the dock/app-switcher — this fills that gap. */
  const EXTRA_WINDOW_ICON: Record<string, string> = {
    'win-explorer': '<img src="img/icons-win98/explorer.png" alt="" />',
    'win-identity': '<img src="img/icons-win98/palette.png" alt="" />',
    'win-process': '<img src="img/icons-win98/gears.png" alt="" />',
  };

  const renderAppSwitcher = (): void => {
    const box = document.getElementById('cs-apps');
    if (!box) return;
    box.innerHTML = '';
    openWins.forEach((id) => {
      const el = document.getElementById(id);
      const label = el?.querySelector('.titlebar .t-title')?.textContent ?? id;
      const iconHtml =
        document.querySelector(`.icon[data-open="${id}"] .glyph`)?.innerHTML ?? EXTRA_WINDOW_ICON[id] ?? '';
      const btn = document.createElement('button');
      btn.className = 'cs-apps-item';
      btn.dataset.winId = id;
      btn.title = label;
      btn.setAttribute('aria-label', label);
      btn.innerHTML = iconHtml;
      btn.addEventListener('click', () => focusWin(id));
      box.appendChild(btn);
    });
  };

  /* ————————————————————— minimize/restore "genie" animation ————————————————————— */
  const MINIMIZE_MS = 260;

  function dockIconRect(id: string): DOMRect | null {
    const item = document.querySelector(`.cs-apps-item[data-win-id="${id}"]`) as HTMLElement | null;
    const target = item ?? document.getElementById('cs-home');
    return target ? target.getBoundingClientRect() : null;
  }

  function transformDeltas(from: DOMRect, to: DOMRect) {
    return {
      dx: to.left + to.width / 2 - (from.left + from.width / 2),
      dy: to.top + to.height / 2 - (from.top + from.height / 2),
      sx: Math.max(0.04, to.width / from.width),
      sy: Math.max(0.04, to.height / from.height),
    };
  }

  function minimizeWin(id: string): void {
    const el = document.getElementById(id) as HTMLElement | null;
    if (!el || el.classList.contains('hidden')) return;
    const to = dockIconRect(id);
    if (!to) {
      el.classList.add('hidden');
      return;
    }
    const { dx, dy, sx, sy } = transformDeltas(el.getBoundingClientRect(), to);
    el.classList.add('minimizing');
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    el.style.opacity = '0';
    window.setTimeout(() => {
      el.classList.remove('minimizing');
      el.classList.add('hidden', 'minimized');
      el.style.transform = '';
      el.style.opacity = '';
    }, MINIMIZE_MS);
  }

  function flyIn(id: string, el: HTMLElement): void {
    const to = dockIconRect(id);
    if (!to) return;
    const { dx, dy, sx, sy } = transformDeltas(el.getBoundingClientRect(), to);
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    el.style.opacity = '0';
    void el.offsetWidth; // commit the jump-to-dock state before the transition below is enabled
    el.classList.add('minimizing');
    el.style.transform = 'translate(0, 0) scale(1, 1)';
    el.style.opacity = '1';
    window.setTimeout(() => {
      el.classList.remove('minimizing');
      el.style.transform = '';
      el.style.opacity = '';
    }, MINIMIZE_MS);
  }

  function focusWin(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    const wasMinimized = el.classList.contains('minimized');
    el.classList.remove('hidden');
    if (wasMinimized) {
      el.classList.remove('minimized');
      flyIn(id, el);
    }
    zTop += 1;
    el.style.zIndex = String(zTop);
    document.querySelectorAll('.window').forEach((w) => w.classList.remove('active'));
    el.classList.add('active');
  }

  function openWin(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    if (!openWins.includes(id)) openWins.push(id);
    renderAppSwitcher();
    focusWin(id);
  }

  function closeWin(id: string): void {
    const el = document.getElementById(id);
    el?.classList.remove('minimized');
    el?.classList.add('hidden');
    const idx = openWins.indexOf(id);
    if (idx !== -1) openWins.splice(idx, 1);
    renderAppSwitcher();
  }

  /* Same shrink animation as minimize, but flies to the trash can and then
     actually closes the window instead of parking it as minimized. */
  function closeWinAnimated(id: string): void {
    const el = document.getElementById(id) as HTMLElement | null;
    const trash = document.getElementById('trash-icon');
    if (!el || el.classList.contains('hidden') || !trash) {
      closeWin(id);
      return;
    }
    const { dx, dy, sx, sy } = transformDeltas(el.getBoundingClientRect(), trash.getBoundingClientRect());
    el.classList.add('minimizing');
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    el.style.opacity = '0';
    window.setTimeout(() => {
      el.classList.remove('minimizing');
      el.style.transform = '';
      el.style.opacity = '';
      closeWin(id);
    }, MINIMIZE_MS);
  }

  function zoomWin(id: string): void {
    if (isMobile()) return;
    focusWin(id);
    document.getElementById(id)?.classList.toggle('zoomed');
  }

  function goHome(): void {
    [...openWins].forEach((id) => closeWin(id));
    openWin('win-about');
  }

  /* ————————————————————— marquee selection + trash —————————————————————
     Selection targets the dock icons in the control strip (they only exist
     for windows that are actually open), not the always-visible desktop
     launcher icons — dragging over them and hitting the trash closes the
     selected open apps. */
  const desktopEl = document.getElementById('desktop');
  const selectionBox = document.createElement('div');
  selectionBox.className = 'selection-box';
  selectionBox.hidden = true;
  desktopEl?.appendChild(selectionBox);

  const clearSelection = (): void => {
    document.querySelectorAll('.cs-apps-item.selected').forEach((el) => el.classList.remove('selected'));
  };

  if (desktopEl) {
    let selecting = false;
    let startX = 0;
    let startY = 0;

    desktopEl.addEventListener('pointerdown', (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.window') || target.closest('.icon') || target.closest('.cs-home') || target.closest('.cs-apps-item')) {
        return;
      }
      selecting = true;
      const rect = desktopEl.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      selectionBox.style.left = `${startX}px`;
      selectionBox.style.top = `${startY}px`;
      selectionBox.style.width = '0px';
      selectionBox.style.height = '0px';
      selectionBox.hidden = false;
      clearSelection();
    });

    window.addEventListener('pointermove', (e: PointerEvent) => {
      if (!selecting) return;
      const rect = desktopEl.getBoundingClientRect();
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;
      const x = Math.min(curX, startX);
      const y = Math.min(curY, startY);
      const w = Math.abs(curX - startX);
      const h = Math.abs(curY - startY);
      selectionBox.style.left = `${x}px`;
      selectionBox.style.top = `${y}px`;
      selectionBox.style.width = `${w}px`;
      selectionBox.style.height = `${h}px`;

      const boxLeft = rect.left + x;
      const boxTop = rect.top + y;
      const boxRight = boxLeft + w;
      const boxBottom = boxTop + h;
      document.querySelectorAll<HTMLElement>('.cs-apps-item').forEach((itemEl) => {
        const r = itemEl.getBoundingClientRect();
        const intersects = r.left < boxRight && r.right > boxLeft && r.top < boxBottom && r.bottom > boxTop;
        itemEl.classList.toggle('selected', intersects);
      });
    });

    window.addEventListener('pointerup', () => {
      if (!selecting) return;
      selecting = false;
      selectionBox.hidden = true;
    });
  }

  document.getElementById('trash-icon')?.addEventListener('click', () => {
    document.querySelectorAll<HTMLElement>('.cs-apps-item.selected').forEach((itemEl) => {
      const id = itemEl.dataset.winId;
      if (id) closeWinAnimated(id);
    });
  });

  /* ————————————————————— dragging (Pointer Events, desktop only) ————————————————————— */
  function startDrag(e: PointerEvent, id: string): void {
    if (isMobile()) return;
    /* Clicks on the titlebar's own boxes (close/minimize/zoom) must not start
       a drag — capturing the pointer on the titlebar retargets the resulting
       click event away from the button, silently swallowing it. */
    if ((e.target as HTMLElement).closest('.mac-box')) return;
    const el = document.getElementById(id) as HTMLElement | null;
    const desktop = document.getElementById('desktop');
    if (!el || !desktop) return;
    focusWin(id);

    const titlebar = e.currentTarget as HTMLElement;
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = el.getBoundingClientRect();
    const parentRect = desktop.getBoundingClientRect();
    const origLeft = rect.left - parentRect.left;
    const origTop = rect.top - parentRect.top;
    const maxLeft = Math.max(0, parentRect.width - rect.width);
    const maxTop = Math.max(0, parentRect.height - rect.height);

    titlebar.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent): void => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const nextLeft = Math.min(Math.max(0, origLeft + dx), maxLeft);
      const nextTop = Math.min(Math.max(0, origTop + dy), maxTop);
      el.style.setProperty('--win-x', `${nextLeft}px`);
      el.style.setProperty('--win-y', `${nextTop}px`);
    };
    const onUp = (ev: PointerEvent): void => {
      titlebar.releasePointerCapture(ev.pointerId);
      titlebar.removeEventListener('pointermove', onMove);
      titlebar.removeEventListener('pointerup', onUp);
    };
    titlebar.addEventListener('pointermove', onMove);
    titlebar.addEventListener('pointerup', onUp);
  }

  /* ————————————————————— resizing (Pointer Events, desktop only) ————————————————————— */
  const MIN_WIN_WIDTH = 260;
  const MIN_WIN_HEIGHT = 180;

  function startResize(e: PointerEvent, id: string): void {
    if (isMobile()) return;
    const el = document.getElementById(id) as HTMLElement | null;
    const desktop = document.getElementById('desktop');
    const handle = e.currentTarget as HTMLElement;
    if (!el || !desktop) return;
    focusWin(id);
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const rect = el.getBoundingClientRect();
    const parentRect = desktop.getBoundingClientRect();
    const origWidth = rect.width;
    const origHeight = rect.height;
    const maxWidth = parentRect.right - rect.left;
    const maxHeight = parentRect.bottom - rect.top;

    handle.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent): void => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const nextWidth = Math.min(Math.max(MIN_WIN_WIDTH, origWidth + dx), maxWidth);
      const nextHeight = Math.min(Math.max(MIN_WIN_HEIGHT, origHeight + dy), maxHeight);
      el.style.setProperty('--win-w', `${nextWidth}px`);
      el.style.setProperty('--win-h', `${nextHeight}px`);
    };
    const onUp = (ev: PointerEvent): void => {
      handle.releasePointerCapture(ev.pointerId);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  }

  document.querySelectorAll<HTMLElement>('[data-open]').forEach((el) => {
    el.addEventListener('click', () => openWin(el.dataset.open ?? ''));
  });
  document.querySelectorAll<HTMLElement>('[data-close]').forEach((el) => {
    el.addEventListener('click', () => closeWin(el.dataset.close ?? ''));
  });
  document.querySelectorAll<HTMLElement>('[data-minimize]').forEach((el) => {
    el.addEventListener('click', () => minimizeWin(el.dataset.minimize ?? ''));
  });
  document.querySelectorAll<HTMLElement>('[data-zoom]').forEach((el) => {
    el.addEventListener('click', () => zoomWin(el.dataset.zoom ?? ''));
  });
  document.querySelectorAll<HTMLElement>('[data-drag]').forEach((el) => {
    el.addEventListener('pointerdown', (e) => startDrag(e as PointerEvent, el.dataset.drag ?? ''));
  });
  document.querySelectorAll<HTMLElement>('[data-resize]').forEach((el) => {
    el.addEventListener('pointerdown', (e) => startResize(e as PointerEvent, el.dataset.resize ?? ''));
  });
  document.getElementById('apple-menu')?.addEventListener('click', () => openWin('win-about'));
  document.getElementById('cs-home')?.addEventListener('click', () => goHome());

  /* ————————————————————— project data ————————————————————— */
  interface ProjectImage { src: string; alt: string; video?: boolean; }
  interface Project {
    key: string;
    tabLabel: string;
    num: string;
    title: string;
    sub: string;
    desc: string;
    features: string[];
    /* Short-labeled beats ("PRINCIPIOS", "COLOR", "EL GIRO"...) instead of a
       wall of paragraphs — rendered as a spec-sheet list, one label per idea. */
    visualIdentity: { label: string; text: string }[];
    creativeProcess: { label: string; text: string }[];
    devProcess: string;
    stack: string[];
    images: ProjectImage[];
    /* Identity extras: palette swatches (shown at the top of "IDENTIDAD
       VISUAL") and a downloadable identity-system PDF when one exists. */
    palette?: { name: string; hex: string }[];
    identityPdf?: string;
    /* Editorial extras: one striking line pulled from visualIdentity, shown as
       a blockquote, and a handful of hard numbers shown as stat chips right
       under the feature list — so the page reads before it's read. */
    pullQuote?: string;
    stats?: { value: string; label: string }[];
    live?: string;
    github: string;
  }

  /* `` `code` `` → <code>code</code> inside prose paragraphs — the only markdown
     this renderer understands, used to set identifiers/hex codes in monospace. */
  function mdInline(text: string): string {
    return text.replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  const PROJECT_ORDER = ['safegram', 'nutrovia', 'angular', 'mandelbrot', 'buscaminas'];

  const PROJECTS: Record<string, Project> = {
    safegram: {
      key: 'safegram',
      tabLabel: 'safegram.exe',
      num: '01 — CIBERSEGURIDAD',
      title: 'SAFEGRAM.EXE',
      sub: 'Sistema de ciberseguridad inteligente para Telegram, WhatsApp y Slack',
      desc:
        'Actúa como un vigilante silencioso: analiza cada mensaje en tiempo real y frena phishing, spam e ' +
        'ingeniería social antes de que un empleado pueda interactuar con ellos. Combina IA (LLM) para ' +
        'clasificación semántica, heurísticas deterministas como filtro rápido y feeds de inteligencia de ' +
        'amenazas (URLhaus, PhishTank, Google Safe Browsing) como evidencia objetiva.',
      features: [
        'Multi-plataforma: Telegram, WhatsApp y Slack',
        'Dashboard web multi-bot con métricas en MongoDB',
        'Alertas a administradores + modo silencioso',
        'Serverless en Vercel o VPS con Docker Compose',
      ],
      palette: [
        { name: 'Noche', hex: '#07090B' },
        { name: 'Verde neón', hex: '#00FF9C' },
        { name: 'Verde tenue', hex: '#00B36B' },
        { name: 'Texto', hex: '#D5E8E1' },
        { name: 'Apagado', hex: '#6F9188' },
        { name: 'Phishing', hex: '#FF5C5C' },
        { name: 'Spam', hex: '#FFB84D' },
        { name: 'Ing. social', hex: '#B06BFF' },
      ],
      pullQuote: 'El dato se ve — sin adorno.',
      stats: [
        { value: '3', label: 'plataformas' },
        { value: '1–3s', label: 'por análisis' },
        { value: '145', label: 'tests' },
      ],
      visualIdentity: [
        {
          label: 'Principios',
          text:
            'Ciberseguridad que se ve como lo que es: un sistema de vigilancia. Tres principios lo sostienen: ' +
            'el dato se ve — todas las métricas en cifras monospace, sin adorno —; un color por amenaza, ' +
            'porque aquí el color clasifica, nunca decora; y la discreción como marca — fondo casi negro y ' +
            'glows tenues, porque nada grita salvo el peligro real.',
        },
        {
          label: 'Color',
          text:
            'Noche (#07090B) como fondo y texto pálido (#D5E8E1) para la lectura. Sobre esa base, el verde ' +
            'neón (#00FF9C) tiene un trabajo único: marcar lo que importa — métricas, títulos, el escudo, ' +
            'los botones — con su verde tenue (#00B36B) para reforzar jerarquías sin llamar la atención. ' +
            'Tres colores más están reservados en exclusiva para las amenazas: rojo (#FF5C5C) phishing, ' +
            'ámbar (#FFB84D) spam y púrpura (#B06BFF) ingeniería social. Nunca aparecen como decoración: ' +
            'solo tiñen la categoría que señalan, en el dashboard y en el chat por igual.',
        },
        {
          label: 'Tipografía y símbolo',
          text:
            'Tipografía de terminal, no de marca: JetBrains Mono (con Fira Code de respaldo) en toda la UI, ' +
            'con cifras tabulares para que los números cuadren, etiquetas en MAYÚSCULAS con espaciado y ' +
            'métricas grandes en peso 700. El único símbolo con identidad propia es el escudo de SafeGram: ' +
            'un guard dentro de una caja de borde verde con glow, que se repite en login y cabecera como ' +
            'sello. Los estados se leen como LEDs de hardware: un punto de luz verde cuando todo está sano ' +
            'y rojo cuando algo falla.',
        },
        {
          label: 'Textura y movimiento',
          text:
            'No hay fotografía — SafeGram no muestra nada que no sea dato. El fondo es una retícula tipo ' +
            'matrix cada 44 píxeles con un brillo radial arriba, y los paneles son vidrio oscuro translúcido ' +
            'con desenfoque y bordes verdes tenues. El movimiento confirma, no entretiene: el hover enciende ' +
            'el borde y el glow en 0.2s, y nada rebota. En el bot, cada categoría se identifica con su propio ' +
            'icono — phishing, spam, ingeniería social o seguro — y el escudo hace de firma.',
        },
        {
          label: 'En vivo',
          text:
            'Así se ve hoy safe-gram.vercel.app: noche casi negra, un escudo verde que brilla suavemente, ' +
            'tarjetas de métricas en neón, una dona con los tres colores de amenaza y filtros por categoría ' +
            '— cyberpunk suave, donde la estética vigila pero nunca decora.',
        },
      ],
      creativeProcess: [
        {
          label: 'El problema',
          text:
            'SafeGram nació de un hueco concreto: las PYMEs usan Telegram como canal interno y no pueden pagar ' +
            'soluciones corporativas de ciberseguridad. Para un TFG de Ingeniería de Computadores, el reto era ' +
            'construir un guardián que no estorbe — la metáfora del vigilante silencioso se convirtió en ' +
            'decisión de UX: en grupos no contesta a los mensajes normales, solo actúa ante una amenaza real.',
        },
        {
          label: 'La decisión',
          text:
            'El diseño hereda esa discreción: las alertas llegan por DM a los administradores con todos los ' +
            'detalles, y el grupo solo ve un aviso sutil con la categoría, sin exponer el contenido. Los ' +
            'colores de amenaza del dashboard (rojo phishing, ámbar spam, púrpura ingeniería social) son el ' +
            'mismo código cromático del bot, para que una misma amenaza se reconozca igual en el chat y en el ' +
            'panel. La tipografía monospace refuerza la idea de terminal de seguridad: cifras tabulares, ' +
            'datos crudos, sin ornamento.',
        },
        {
          label: 'El giro',
          text:
            'La primera versión buscó la privacidad total con una Raspberry Pi y un modelo local, pero la ' +
            'latencia (~10s por análisis) y la falta de feeds de amenazas demostraron que la nube era el ' +
            'camino: Groq gratuito a 1-3s y evidencia objetiva de URLhaus y PhishTank. Ahí quedó la estética: ' +
            'un cyberpunk sobrio que recuerda que detrás de cada mensaje hay un sistema mirando.',
        },
      ],
      devProcess:
        'SafeGram empezó como un Trabajo Fin de Grado: un vigilante silencioso para PYMEs que usan ' +
        'Telegram como canal interno y no pueden pagar soluciones corporativas. La primera versión corría ' +
        'en una Raspberry Pi 5 con Docker: bot en python-telegram-bot, monitor de red con Suricata y un ' +
        'LLM local (Ollama + TinyLlama) para clasificar cada mensaje. La batalla de esa etapa fue enseñar ' +
        'a un modelo pequeño a emitir JSON válido: ajustes de num_predict, modo JSON, prompts mínimos para ' +
        'que no copiara definiciones, filtrado de placeholders y coincidencia difusa de categorías — cada ' +
        'commit curaba un síntoma nuevo del modelo.' +
        '\n\n' +
        'La versión final apostó por la nube y simplificó todo: fuera el modo on-premise (un análisis ' +
        'tardaba ~10s en la Pi frente a 1-3s en Groq, y sin feeds de amenazas) y fuera Suricata. Quedaron ' +
        'tres capas de análisis: IA (Groq, gratis, API compatible con OpenAI) para clasificación ' +
        'semántica; heurísticas deterministas como filtro rápido y fallback si la IA cae; y feeds de ' +
        'inteligencia de amenazas (URLhaus, PhishTank, Google Safe Browsing) como evidencia objetiva que ' +
        'sobreescribe la categoría con confianza alta. El bot pasó de un VPS (despliegue automático en ' +
        'Oracle Cloud Free Tier) a Vercel en modo webhook, sin procesos continuos — cliente de MongoDB ' +
        'fresco por petición, conexión perezosa de la IA y autocuración de conexiones para sobrevivir al ' +
        'frío del serverless.' +
        '\n\n' +
        'Después llegó el multi-tenant: cuentas de usuario con varios bots por cuenta (cada token de ' +
        '@BotFather validado con getMe), configuración por chat persistida en MongoDB y alertas que llegan ' +
        'por DM a todos los administradores del grupo, con modo silencioso en grupos y un aviso sutil ' +
        'cuando una amenaza es severa. La pieza final fue la capa de plataforma: un contrato ' +
        'PlatformAdapter + IncomingMessage desacopló el análisis del canal y permitió añadir WhatsApp ' +
        '(Cloud API de Meta) y Slack (Events API + Web API) sin tocar la lógica de detección. El ' +
        'resultado: una suite de 145 tests que corre sin servicios externos, tres plataformas y un ' +
        'dashboard web que lo muestra todo en vivo.',
      stack: ['Python', 'Vercel', 'MongoDB', 'IA', 'Multi-plataforma'],
      images: [
        { src: 'img/safegram-mockup-1.png', alt: 'Dashboard de SafeGram' },
        { src: 'img/safegram-mockup-2.png', alt: 'Detección de una amenaza en SafeGram' },
        { src: 'img/safegram-mockup-3.png', alt: 'Métricas del dashboard de SafeGram' },
      ],
      live: 'https://safe-gram.vercel.app/',
      github: 'https://github.com/edward15001/SafeGram',
    },
    nutrovia: {
      key: 'nutrovia',
      tabLabel: 'nutrovia.exe',
      num: '02 — SALUD & FITNESS',
      title: 'NUTROVIA.EXE',
      sub: 'Plataforma integral de nutrición y entrenamiento',
      desc:
        'Democratiza el acceso a planes de salud personalizados. Analiza los parámetros físicos de cada ' +
        'usuario, calcula macronutrientes exactos y genera rutinas dinámicas adaptadas a su nivel, material ' +
        'disponible y objetivo: volumen, definición o mantenimiento.',
      features: [
        'Análisis paramétrico de necesidades calóricas',
        'Generación dinámica de rutinas y dietas',
        'Dashboard de progresión centrado en el usuario',
        'Pasarela de pago operativa (entorno real)',
      ],
      palette: [
        { name: 'Papel', hex: '#F2EFE8' },
        { name: 'Hueso', hex: '#E8E4DA' },
        { name: 'Tinta', hex: '#1B1A17' },
        { name: 'Savia', hex: '#3A6B4F' },
        { name: 'Malva', hex: '#5A5183' },
        { name: 'Arcilla', hex: '#A8523F' },
        { name: 'Ámbar', hex: '#C98B3C' },
      ],
      identityPdf: 'visual-identity/Identidad%20visual%20Nutrovia%20Web%20App.pdf',
      pullQuote: 'El color clasifica, nunca decora.',
      stats: [
        { value: '4', label: 'dominios de color' },
        { value: '14€', label: 'plan Pro / mes' },
        { value: '62', label: 'tests' },
      ],
      visualIdentity: [
        {
          label: 'Principios',
          text:
            'Nutrición y entrenamiento personalizados, con el rigor de un laboratorio y el trato de alguien ' +
            'que te conoce. Cuatro principios lo sostienen: cercano sin ser blando, el dato se ve — calorías, ' +
            'macros y progreso en cifras tabulares, sin adorno —, estructura a la vista — rejilla modular, ' +
            'esquinas rectas, nada flota — y un solo color por dominio, porque aquí el color clasifica, nunca ' +
            'decora.',
        },
        {
          label: 'Color',
          text:
            'Papel cálido (#F2EFE8) como fondo y tinta (#1B1A17) para texto y filetes. Sobre esa base, cuatro ' +
            'roles cromáticos con un trabajo asignado cada uno: savia para nutrición y logro, malva para ' +
            'descanso, arcilla para el entreno y ámbar para avisos y límites. El tinte de cada rol llena el ' +
            'fondo de sus tarjetas, su paso 500 marca el icono y la cifra, y para texto en color siempre se ' +
            'usa el 700 — el botón primario es siempre savia. Nada de degradados ni dorados heredados.',
        },
        {
          label: 'Tipografía e iconografía',
          text:
            'Newsreader Light 300, con su itálica, para las voces de marca — titulares y frases de portada, ' +
            'nunca en interfaz funcional — y Archivo (400/600/800) con cifras tabulares para toda la UI, de ' +
            'modo que las columnas cuadren. Los iconos son Lucide de trazo 1.5 en caja de 24px: acompañan a ' +
            'la etiqueta, nunca la sustituyen, y solo se tiñen de savia cuando marcan un estado conseguido.',
        },
        {
          label: 'Fotografía y movimiento',
          text:
            'La fotografía es siempre en blanco y negro, con luz natural lateral y gesto real — el color de ' +
            'la página lo pone la marca, nunca la foto. Esquinas rectas en todo, filete de 2px entre bloques ' +
            'y movimiento que confirma, no entretiene: entrada a 320ms, barras de progreso a 640ms, nada ' +
            'rebota. Así se ve hoy nutrovia.es: savia en el botón que arranca el plan, el tinte de cada rol ' +
            'en sus tarjetas y cifras tabulares que no mienten.',
        },
      ],
      creativeProcess: [
        {
          label: 'Antes',
          text:
            'La dirección anterior era oro sobre negro: fondo #0a0a0a, acentos #c9a84c, Outfit con un toque ' +
            'de Fraunces itálica sobre una foto de stock oscurecida — elegante, pero genérico.',
        },
        {
          label: 'Después',
          text:
            'La portada se reconstruyó sobre el sistema nuevo: papel cálido, una sola voz cromática verde y ' +
            'una promesa más concreta ("Tu mejor versión, calculada.") que respalda los números, no la ' +
            'estética. De ahí salen el resto de decisiones: retícula modular, filetes de 2px y movimiento ' +
            'sobrio que confirma, no entretiene.',
        },
      ],
      devProcess:
        'Backend Express + Node con PostgreSQL (Supabase vía pooler) y un frontend HTML/CSS/JS servido ' +
        'por el mismo servidor, todo desplegado en Vercel bajo nutrovia.es. La app móvil (Expo/React ' +
        'Native) comparte la misma API y añade un diario alimentario con cámara. Los planes salen de un ' +
        'motor científico (Harris-Benedict) que calcula macros exactos, sesiones de entrenamiento y ' +
        'suplementos, y para los usuarios Pro de una IA que escribe el menú completo de la semana.' +
        '\n\n' +
        'El mayor reto fue el cobro: la primera versión guardaba la tarjeta con un SetupIntent y nunca se ' +
        'confirmaba el PaymentIntent de la primera factura — el banco solo veía 0,00 € de verificación y ' +
        'la suscripción no se activaba. Se pasó a presentar el PaymentIntent real de 14 € en el ' +
        'PaymentSheet, con webhooks de Stripe en live que actualizan la BD de forma idempotente. Por el ' +
        'camino se corrigieron clásicos del mundo real: doble cobro al re-suscribirse (la sub antigua no ' +
        'se cancelaba), un webhook que anulaba la suscripción nueva por buscar por stripe_customer_id en ' +
        'vez de stripe_subscription_id, y una factura tardía que reactivaba una sub ya cancelada.' +
        '\n\n' +
        'El plan alterna motor e IA: si el proveedor (Groq) responde, la IA genera el menú en ~10s; si el ' +
        'free tier devuelve 429, se cae al motor en menos de 1s. Un backoff exponencial que respeta el ' +
        'header Retry-After estabilizó las caídas, y el diario móvil amplía la IA a visión: la comida se ' +
        'analiza desde una foto. Todo el backend se apoya en una suite de tests con el runner nativo de ' +
        'Node —62 tests de motor de planes, IA mockeada, pagos y webhooks— para desplegar y verificar en ' +
        'producción con confianza.',
      stack: ['TypeScript', 'Express', 'SQL'],
      images: [
        { src: 'img/nutrovia/nutrovia_hero.png', alt: 'NutroVia — portada de identidad v1.0, papel y savia' },
        { src: 'img/nutrovia/nutrovia_dashboard.png', alt: 'NutroVia — panel "tu día de un vistazo"' },
        { src: 'img/nutrovia/nutrovia_domains.png', alt: 'NutroVia — los cuatro dominios de color: savia, arcilla, malva, ámbar' },
        { src: 'img/nutrovia/nutrovia_pricing.png', alt: 'NutroVia — planes Free y Pro' },
        { src: 'img/nutrovia/nutrovia_login.png', alt: 'NutroVia — pantalla de acceso' },
      ],
      live: 'https://nutrovia.es/',
      github: 'https://github.com/edward15001/nutrovia-web-app',
    },
    angular: {
      key: 'angular',
      tabLabel: 'angular-tasks.exe',
      num: '03 — PRODUCTIVIDAD',
      title: 'ANGULAR TASK MANAGER.EXE',
      sub: 'Gestión de agenda y autenticación avanzada',
      desc:
        'Un showcase de Angular diseñado como herramienta funcional y como lienzo técnico: flujos de trabajo ' +
        'eficientes, manejo de estados complejos y gestión de usuarios con una autenticación robusta ' +
        'mantenida a lo largo de toda la sesión.',
      features: [
        'Signals y computed() para estado 100% reactivo',
        'Auth real con Supabase, guards funcionales (canActivate)',
        'CRUD de tareas con exportación/importación JSON y CSV',
        'Tema claro/oscuro persistido, sincronizado con effect()',
      ],
      palette: [
        { name: 'Vacío', hex: '#000000' },
        { name: 'Superficie', hex: '#141414' },
        { name: 'Naranja', hex: '#FF6B35' },
        { name: 'Naranja claro', hex: '#FF8C42' },
        { name: 'Azul', hex: '#4A90E2' },
        { name: 'Azul acento', hex: '#357ABD' },
        { name: 'Éxito', hex: '#10B981' },
        { name: 'Peligro', hex: '#EF4444' },
      ],
      pullQuote: 'Una vitrina técnica, no un producto de consumo.',
      stats: [
        { value: '6', label: 'standalone components' },
        { value: '0', label: 'NgModules' },
        { value: '20s', label: 'loop de la nebulosa' },
      ],
      visualIdentity: [
        {
          label: 'Principios',
          text:
            'Una vitrina técnica, no un producto de consumo: fondo casi negro (#000000) para que las tarjetas ' +
            'de cristal respiren, dos voces cromáticas — naranja y azul — en vez del rojo de marca de ' +
            'Angular, y tipografía de terminal en todo el cuerpo para dejar claro que esto es código en ' +
            'pantalla, no una app genérica generada por un starter.',
        },
        {
          label: 'Superficie',
          text:
            'Detrás de cada tarjeta hay una nebulosa animada: cuatro gradientes radiales — cian, magenta, ' +
            'ámbar y violeta — girando en 20s sobre el negro, y encima el cristal: `.glass-card` con blur de ' +
            '10px, borde translúcido al 8% y una elevación de 4px con glow al hover. El naranja (#FF6B35 → ' +
            '#FF8C42) es la voz de la acción primaria — el botón de iniciar sesión, el de nueva tarea — con ' +
            'su propio glow-shadow al pasar el cursor; el azul (#4A90E2 → #357ABD) queda para lo secundario y ' +
            'para el estado "completada". Verde (#10B981) y rojo (#EF4444) solo aparecen en badges de estado, ' +
            'nunca como decoración.',
        },
        {
          label: 'Tipografía',
          text:
            'Instrument Sans en negrita para los titulares (de 3rem en h1 a 1rem en h6) y JetBrains Mono para ' +
            'absolutamente todo lo demás — párrafos, botones, inputs, badges — incluso el placeholder de un ' +
            'campo de texto. Es una combinación deliberada: sans humanista para la voz de marca, monospace ' +
            'para la interfaz funcional, igual que hacen las herramientas para desarrolladores.',
        },
        {
          label: 'Tema claro/oscuro',
          text:
            'El tema claro existe pero es secundario: cambia fondos y sombras a una paleta clara, sin tocar ' +
            'el naranja/azul de acento, y se activa con una clase `light-theme` en el body que un ' +
            '`ThemeService` sincroniza automáticamente vía `effect()` y guarda en localStorage.',
        },
      ],
      creativeProcess: [
        {
          label: 'El encargo',
          text:
            'Angular Task Manager nació como material de una presentación técnica sobre Angular moderno ' +
            '(v17+): Standalone Components, Signals, el nuevo control de flujo (`@if`, `@for`) y Signal-based ' +
            'Effects.',
        },
        {
          label: 'La decisión',
          text:
            'El reto creativo era evitar que se viera como "otro starter de Angular" — con el rojo de marca y ' +
            'una plantilla genérica — así que la dirección visual se apartó deliberadamente de esa paleta: un ' +
            'duotono naranja/azul propio, cristal sobre una nebulosa animada y tipografía monospace en toda ' +
            'la interfaz, para que la propia estética dijera "herramienta de desarrollador" antes de que el ' +
            'visitante leyera una sola línea de código.',
        },
      ],
      devProcess:
        'Cada pantalla es un Standalone Component (`LoginComponent`, `DashboardComponent`, `TaskListComponent`, ' +
        '`TaskItemComponent`, `StatsCardComponent`, `ToastComponent`) sin `NgModules`: cada uno declara sus ' +
        'propios imports y Angular resuelve el árbol de dependencias sin boilerplate. El estado del login vive ' +
        'en signals (`email`, `password`, `isLoading`) y las plantillas usan la nueva sintaxis `@if`/`@for` en ' +
        'vez de `*ngIf`/`*ngFor`.' +
        '\n\n' +
        'El backend es Supabase real: `AuthService` restaura la sesión al arrancar, deriva un nombre legible ' +
        'del email cuando no hay perfil en base de datos y genera un avatar con el naranja de marca ' +
        '(`ui-avatars.com?background=ff6b35`). Como Angular Universal renderiza en servidor, el arranque está ' +
        'protegido con `PLATFORM_ID`/`isPlatformBrowser` para no tocar Supabase fuera del navegador. ' +
        '`TaskService` expone `tasks` como signal de solo lectura y deriva `stats`, `overdueTasks` y `allTags` ' +
        'con `computed()` — se recalculan solos y solo cuando hace falta.' +
        '\n\n' +
        'El reto de arquitectura fue una dependencia circular: `AuthService` necesita avisar a `TaskService` ' +
        'al hacer login/logout, pero `TaskService` también inyecta `AuthService`. Se resolvió con `import()` ' +
        'dinámico más `Injector.get()` en vez de inyección por constructor, rompiendo el ciclo en tiempo de ' +
        'ejecución. Los guards de rutas (`authGuard`, `loginGuard`) son funciones, no clases — el patrón ' +
        'funcional que reemplazó a `CanActivate` en Angular moderno — y las tareas se pueden exportar/importar ' +
        'en JSON y CSV directamente desde el navegador con Blobs.',
      stack: ['Angular', 'TypeScript', 'Supabase', 'Signals'],
      images: [{ src: 'img/angular-showcase.jfif', alt: 'Vista previa de Angular Task Manager' }],
      live: 'https://angular-showcase.es/login',
      github: 'https://github.com/edward15001/angular-showcase',
    },
    mandelbrot: {
      key: 'mandelbrot',
      tabLabel: 'mandelbrot.exe',
      num: '04 — CONCURRENCIA',
      title: 'GENERADOR MANDELBROT.EXE',
      sub: 'Renderizador paralelo y concurrente del fractal de Mandelbrot',
      desc:
        'Compara estrategias de programación concurrente y paralela frente a una carga intensiva de CPU. Un ' +
        'problema "vergonzosamente paralelo" convertido en laboratorio de benchmarking.',
      features: [
        'Tres estrategias sobre el mismo render: secuencial, ExecutorService y ForkJoinPool',
        'Speedup casi lineal hasta 8 hilos (6.91x) — y caída a 16 por sobre-suscripción',
        'Color derivado del propio algoritmo: sin paleta elegida a mano',
      ],
      palette: [
        { name: 'Vacío (conjunto)', hex: '#000000' },
        { name: 'Escape rápido', hex: '#0000FF' },
        { name: 'Escape medio', hex: '#7F0080' },
        { name: 'Frontera', hex: '#FF0000' },
      ],
      pullQuote: 'El algoritmo es la identidad visual.',
      stats: [
        { value: '6.91x', label: 'speedup con 8 hilos' },
        { value: '50', label: 'filas por tarea (umbral)' },
        { value: '2', label: 'canales de color, sin verde' },
      ],
      visualIdentity: [
        {
          label: 'La fórmula',
          text:
            'Aquí no hay diseñador: el algoritmo es la identidad visual. `colorFromIterations()` pinta cada ' +
            'píxel directamente desde el dato — si la órbita nunca escapa (`iter == maxIterations`, el punto ' +
            'pertenece al conjunto) el píxel es negro puro; si escapa, `r = 255·iter/maxIterations` y ' +
            '`b = 255 - r`, sin canal verde. Un degradado de dos canales que nace del cálculo, no de una ' +
            'paleta elegida a mano.',
        },
        {
          label: 'El degradado',
          text:
            'Ese degradado cuenta el coste real de cada píxel: azul puro (0,0,255) es donde la órbita escapa ' +
            'en la primera iteración — el fondo, la mayor parte del lienzo, la parte barata de calcular. Rojo ' +
            'puro (255,0,0) aparece justo antes del límite de iteraciones, en la frontera erizada del ' +
            'conjunto. Y en el punto medio emerge, sin que nadie lo planeara, un púrpura (127,0,128) — la ' +
            'aritmética de un canal que sube y otro que baja a la vez cruza inevitablemente por ahí.',
        },
        {
          label: 'El coste',
          text:
            'El negro y el rojo marcan justo donde el programa trabaja más: el interior nunca escapa y agota ' +
            'las maxIterations completas, y la frontera casi tampoco — mientras que el azul de fondo se ' +
            'resuelve en un puñado de iteraciones. Mirar dónde se concentra el negro y el rojo es mirar, ' +
            'literalmente, dónde el hilo que renderiza esa fila tarda más — el color es, sin proponérselo, un ' +
            'mapa de calor del propio benchmark.',
        },
        {
          label: 'Sin marca',
          text:
            'Sin tipografía de marca ni logo: la salida son PNGs (`BufferedImage.TYPE_INT_RGB`) y una tabla de ' +
            'tiempos por consola. La interfaz es Maven — `mvn exec:java` — y un README con su tabla de ' +
            'speedups. Encaja con lo que es el proyecto: un banco de pruebas de concurrencia, no un producto ' +
            'con cara.',
        },
      ],
      creativeProcess: [
        {
          label: 'El reto',
          text:
            'Nació como práctica de una asignatura de Programación Concurrente y Paralela: el reto era ' +
            'encontrar un problema "vergonzosamente paralelo" — cada píxel es independiente — para aislar el ' +
            'efecto de la estrategia de paralelización de cualquier otra variable. El Conjunto de Mandelbrot ' +
            'se eligió por eso, no por estética: se reparte limpio en filas o en regiones, y cada estrategia ' +
            'se corrió sobre el mismo render para que los números de la tabla fueran comparables entre sí.',
        },
        {
          label: 'La metodología',
          text:
            'La identidad del proyecto no es de marca, es metodológica: la misma función de color en las tres ' +
            'implementaciones para que la comparación sea justa, y cada imagen generada lleva su ' +
            'configuración de zoom e iteraciones en el propio render. Lo único "diseñado" a propósito fue ' +
            'evitar el canal verde — una decisión de simplicidad, no de gusto — y ese recorte es, ' +
            'precisamente, lo que le da al fractal su aire de instrumento de laboratorio en vez de póster ' +
            'decorativo.',
        },
      ],
      devProcess:
        'Tres renderizadores comparten la misma función pura `MandelbrotCalculator.iterationsForPoint()`, así ' +
        'la comparación mide la estrategia de paralelización y no el cálculo matemático. `SequentialRenderer` ' +
        'recorre filas y columnas en bucles anidados como línea base. `ParallelRendererExecutor` reparte filas ' +
        'entre un `ExecutorService` de tamaño fijo. `ForkJoinRenderer` divide el rango de filas recursivamente ' +
        '(`RecursiveAction`, umbral de 50 filas por tarea) y usa `invokeAll` para el divide-y-vencerás, con ' +
        'work-stealing del `ForkJoinPool.commonPool()`.' +
        '\n\n' +
        'Los números, todos sobre la misma imagen: secuencial 1542ms de línea base; 1 hilo, 1539ms, confirma ' +
        'que el overhead del pool es despreciable; 2 hilos, 755ms (2.04x); 4 hilos, 401ms (3.85x); 8 hilos, ' +
        '223ms y el mejor resultado (6.91x, casi lineal). A partir de ahí el rendimiento cae: 16 hilos suben a ' +
        '250ms (6.17x) — más hilos que núcleos físicos añade cambios de contexto sin capacidad de cómputo ' +
        'nueva, una demostración empírica limpia del techo que impone la Ley de Amdahl.' +
        '\n\n' +
        'ForkJoinPool queda en 328ms (4.70x) — más lento que el pool fijo de 8 hilos pese a correr en el mismo ' +
        'hardware, porque el trabajo por fila es casi uniforme: la división recursiva y el work-stealing pagan ' +
        'overhead que aquí no compra nada, ya que no hay desequilibrio de carga que repartir. La conclusión del ' +
        'benchmark es la que dicta el README: para este problema concreto, un pool fijo de hilos por fila gana ' +
        'a un framework más general pensado para cargas irregulares.',
      stack: ['Java', 'Concurrency', 'Fork/Join', 'ExecutorService'],
      images: [
        { src: 'img/mandelbrot_forkjoin.png', alt: 'Render del fractal de Mandelbrot (versión póster)' },
        {
          src: 'img/mandelbrot_raw_render.png',
          alt: 'Salida real del renderizador: negro (conjunto), azul (escape rápido), rojo en la frontera fractal',
        },
      ],
      github: 'https://github.com/edward15001/parallel-mandelbrot-java',
    },
    buscaminas: {
      key: 'buscaminas',
      tabLabel: 'buscaminas.exe',
      num: '05 — JUEGOS',
      title: 'BUSCAMINAS.EXE',
      sub: 'El clásico reinventado como duelo competitivo — cuentas, ranking y un HUD de hacking, en Swing',
      desc:
        'El Buscaminas de siempre, pero vestido como un terminal de hacking competitivo: dos jugadores en ' +
        'local compiten sobre el mismo tipo de tablero, cada uno con su marcador y su rango, mientras cuentas ' +
        'cifradas con BCrypt y un ranking persistente en SQLite deciden quién gana de verdad.',
      features: [
        'Cuentas con roles: administrador y jugador, contraseñas cifradas con BCrypt',
        'Modo competitivo local a dos jugadores, con ranking persistente en SQLite',
        'Algoritmo recursivo flood-fill para despejar casillas',
        'Panel de administración: crear/eliminar usuarios y ver estadísticas globales',
      ],
      palette: [
        { name: 'Fondo', hex: '#111111' },
        { name: 'Panel', hex: '#1A1A1A' },
        { name: 'Neón (texto y acento)', hex: '#CCFF00' },
        { name: 'Rejilla atenuada', hex: '#556611' },
      ],
      pullQuote: 'Un buscaminas de toda la vida, vestido de terminal de hacking.',
      stats: [
        { value: '2', label: 'jugadores en local' },
        { value: '+100', label: 'pts por mina' },
        { value: '0px', label: 'radio de esquina' },
      ],
      visualIdentity: [
        {
          label: 'Principios',
          text:
            'El clásico reinterpretado como terminal de hacking competitivo: fondo casi negro (#111111), ' +
            'paneles apenas un tono más claro (#1A1A1A) y un único color con voz — verde chartreuse neón ' +
            '(#CCFF00) — que hace de texto, borde y acento a la vez. No hay una paleta de colores por ' +
            'categoría como en SafeGram: aquí todo habla con la misma voz, como un terminal de fósforo.',
        },
        {
          label: 'Esquinas y controles',
          text:
            'Bordes de 1px sin redondear en botones, campos y tablas — nada de esquinas suaves — y ' +
            '`Theme.applyTheme()` recorre recursivamente cada componente Swing (paneles, botones, tablas, ' +
            'listas, pestañas) para forzarlo dentro de esta paleta, así ningún control por defecto de Swing ' +
            '—gris, con relieve 3D— se cuela en pantalla. Las pestañas usan un `ModernTabbedPaneUI` pintado a ' +
            'mano, porque Swing no trae pestañas tipo píldora de fábrica.',
        },
        {
          label: 'Tipografía y HUD',
          text:
            'Todo en `Monospaced`, de la pantalla de login a la tabla de ranking, porque la ambición no es un ' +
            'buscaminas bonito: es un HUD. La partida se anuncia como "COMPETITIVE MINESWEEPER // PHASE 03 / ' +
            'SECTOR 7", el marcador se lee como estadísticas de una partida ranked (RANK: MASTER [III], APM: ' +
            '112, ACCURACY: 97.8%) y el estado se etiqueta "GAME_STATE: RANKED_LIVE" — un buscaminas de toda ' +
            'la vida, vestido como si fuera un simulador de hacking competitivo.',
        },
        {
          label: 'La cuadrícula',
          text:
            'El único adorno es funcional: la cuadrícula usa el verde atenuado (#556611) para las líneas y el ' +
            'neón completo solo para los números revelados, así el tablero se lee sin que el "chrome" del ' +
            'sistema —rango, stats, log de sesión— compita por atención.',
        },
      ],
      creativeProcess: [
        {
          label: 'La pregunta',
          text:
            'La idea de partida era la más simple posible — el Buscaminas de siempre, hecho en Swing para ' +
            'practicar POO — pero la dirección creativa lo llevó a otro sitio: en vez de un tablero gris con ' +
            'banderas rojas, la pregunta fue "¿y si esto fuera una partida ranked de un juego de hacking?". ' +
            'De ahí sale toda la fantasía: dos jugadores en local (host contra invitado) compiten a la vez ' +
            'sobre el mismo tablero, cada uno con su marcador, minas encontradas y "rango" — aunque el rango ' +
            'y el APM sean, hoy, texto decorativo (`"112" // Dummy`, literal en el código) que anticipa una ' +
            'capa de estadísticas en tiempo real todavía por construir.',
        },
        {
          label: 'Lo que es real',
          text:
            'Lo que sí es real es la infraestructura detrás de la fantasía: cuentas de usuario, contraseñas ' +
            'cifradas y un ranking persistente que mide de verdad quién gana. Vestir un ejercicio académico ' +
            'con la estética de un terminal competitivo fue la manera de convertir una demo de POO en algo ' +
            'con ganas de jugarse dos veces.',
        },
      ],
      devProcess:
        'MVC ligero sobre Java Swing + Maven: `model/` (User, Game), `dao/` (UserDAO, GameDAO sobre JDBC), ' +
        '`db/` (DatabaseConnection) y `ui/` (MainFrame, LoginPanel, AdminPanel, UserPanel, GamePanel, Theme, ' +
        'ModernTabbedPaneUI). Las contraseñas se cifran con BCrypt desde el primer commit — incluida la cuenta ' +
        '`admin`/`admin` que se siembra automáticamente en el primer arranque — y la base SQLite se guarda ' +
        'fuera del proyecto, en `~/.minesweeper/minesweeper.db`, para que recompilar no borre ni las partidas ' +
        'ni el ranking de nadie.' +
        '\n\n' +
        'Dos roles con paneles distintos: `AdminPanel` (crear/eliminar usuarios, ver todas las estadísticas de ' +
        'la aplicación) y `UserPanel` (jugar, ver su propio historial). El tablero revela casillas vacías con ' +
        'flood-fill recursivo — `revealCell()` se llama a sí misma sobre las 8 celdas vecinas cada vez que ' +
        'destapa un cero — el mismo algoritmo de cualquier buscaminas clásico, corriendo aquí dentro de un HUD ' +
        'verde neón.' +
        '\n\n' +
        'Cada partida terminada se persiste con `GameDAO.recordGame()` y actualiza el ranking global vía ' +
        '`UserDAO.updateUserStats()`, ordenado por partidas ganadas y minas encontradas — el marcador en ' +
        'pantalla (`p1Score`, `p2Score`, +100 puntos por mina marcada) es el mismo número que termina guardado ' +
        'en SQLite al cerrar la partida.',
      stack: ['Java', 'Swing', 'SQLite', 'BCrypt'],
      images: [
        { src: 'img/buscaminas/javaw_mqSzgrWh3H.png', alt: 'Partida en curso de Buscaminas Java' },
        { src: 'img/buscaminas/javaw_QoStHDSyzB.png', alt: 'Buscaminas Java — vista de tablero' },
        { src: 'img/buscaminas/javaw_ccFvOPOd0p.png', alt: 'Buscaminas Java — partida ganada' },
        { src: 'img/buscaminas/javaw_w5zVqdFM3I.png', alt: 'Buscaminas Java — partida perdida' },
      ],
      github: 'https://github.com/edward15001/java-minesweeper',
    },
  };

  /* ————————————————————— browser app (projects) ————————————————————— */
  const tabStrip = document.getElementById('tab-strip');
  const addrText = document.getElementById('addr-text');
  const browserContent = document.getElementById('browser-content');
  const browserLoading = document.getElementById('browser-loading');
  let currentTab = PROJECT_ORDER[0];

  function renderProjectContent(p: Project): string {
    const gallery = p.images
      .map((img) =>
        img.video
          ? `<video src="${img.src}" muted loop autoplay playsinline aria-label="${img.alt}"></video>`
          : `<img src="${img.src}" alt="${img.alt}" loading="lazy" />`,
      )
      .join('');
    const links =
      (p.live ? `<a href="${p.live}" target="_blank" rel="noopener">Ver en vivo &nearr;</a>` : '') +
      `<a href="${p.github}" target="_blank" rel="noopener">GitHub</a>`;
    const paletteHtml = p.palette
      ? `<div class="id-palette">${p.palette
          .map(
            (c) => `
        <div class="id-swatch">
          <span class="id-swatch__chip" style="background:${c.hex}"></span>
          <span class="id-swatch__name">${c.name}</span>
          <span class="id-swatch__hex">${c.hex}</span>
        </div>`,
          )
          .join('')}
      </div>`
      : '';
    /* IDENTIDAD VISUAL and PROCESO CREATIVO read as a spec sheet, not a wall of
       prose: one short label per idea ("COLOR", "EL GIRO"...) beside its text. */
    const specList = (items: { label: string; text: string }[]): string =>
      `<div class="spec-list">${items
        .map(
          (it) => `
        <div class="spec-row">
          <div class="spec-row__label">${it.label}</div>
          <p class="spec-row__text">${mdInline(it.text)}</p>
        </div>`,
        )
        .join('')}</div>`;
    const identityHtml = specList(p.visualIdentity);
    const creativeProcessHtml = specList(p.creativeProcess);
    /* PROCESO DE DESARROLLO reads as a numbered timeline, not a wall of text:
       each paragraph becomes one step, its opening sentence bolded as a lead-in
       so the timeline is scannable even before reading the full paragraph. */
    const devProcessHtml = `<ol class="timeline">${p.devProcess
      .split('\n\n')
      .map((para, i) => {
        const cut = para.indexOf('. ');
        const lead = cut === -1 ? para : para.slice(0, cut + 1);
        const rest = cut === -1 ? '' : para.slice(cut + 2);
        return `
        <li class="timeline__step">
          <span class="timeline__num">${i + 1}</span>
          <div class="timeline__body"><strong>${mdInline(lead)}</strong>${rest ? ' ' + mdInline(rest) : ''}</div>
        </li>`;
      })
      .join('')}</ol>`;
    const identityPdfHtml = p.identityPdf
      ? `<p class="id-download"><a href="${p.identityPdf}" target="_blank" rel="noopener">Descargar identidad visual completa (PDF) &darr;</a></p>`
      : '';
    const pullQuoteHtml = p.pullQuote ? `<blockquote class="pull-quote">${p.pullQuote}</blockquote>` : '';
    const statsHtml = p.stats?.length
      ? `<div class="stat-row">${p.stats
          .map(
            (s) => `
        <div class="stat-chip">
          <span class="stat-chip__value">${s.value}</span>
          <span class="stat-chip__label">${s.label}</span>
        </div>`,
          )
          .join('')}
      </div>`
      : '';
    /* Capped in a `.site-inner` reading column — on an ultrawide monitor the
       zoomed window can get very wide, and without a cap the gallery/palette
       grids stretch huge while the (fixed-size) text stays small. */
    return `
      <div class="site-inner">
        <span class="site-num">${p.num}</span>
        <h3>${p.title}</h3>
        <p class="site-sub">${p.sub}</p>
        <p>${p.desc}</p>
        <ul>${p.features.map((f) => `<li>${f}</li>`).join('')}</ul>
        ${statsHtml}
        <div class="site-gallery">${gallery}</div>
        <div class="site-section">
          <h4>IDENTIDAD VISUAL</h4>
          ${pullQuoteHtml}
          ${paletteHtml}
          ${identityHtml}
          ${identityPdfHtml}
        </div>
        <div class="site-section">
          <h4>PROCESO CREATIVO</h4>
          ${creativeProcessHtml}
        </div>
        <div class="site-section">
          <h4>PROCESO DE DESARROLLO</h4>
          ${devProcessHtml}
        </div>
        ${p.stack.map((t) => `<span class="project-tag">${t}</span>`).join('')}
        <div class="site-links">${links}</div>
      </div>
    `;
  }

  function switchTab(name: string, opts: { fast?: boolean } = {}): void {
    const p = PROJECTS[name];
    if (!p) return;
    currentTab = name;
    document.querySelectorAll<HTMLElement>('.tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === name);
    });
    if (addrText) addrText.textContent = `eduardo.os/proyectos/${name}.exe`;

    const bar = browserLoading;
    if (bar && !opts.fast) {
      bar.style.width = '0%';
      bar.style.transition = 'none';
      requestAnimationFrame(() => {
        bar.style.transition = 'width .25s ease';
        bar.style.width = '100%';
      });
    }

    const apply = (): void => {
      if (!browserContent) return;
      browserContent.className = `site-${name}`;
      browserContent.innerHTML = renderProjectContent(p);
      browserContent.scrollTop = 0;
      if (bar) window.setTimeout(() => { bar.style.width = '0%'; }, 200);
    };
    if (opts.fast) apply();
    else window.setTimeout(apply, 120);
  }

  if (tabStrip) {
    PROJECT_ORDER.forEach((key) => {
      const p = PROJECTS[key];
      const tab = document.createElement('div');
      tab.className = 'tab';
      tab.dataset.tab = key;
      tab.textContent = p.tabLabel;
      tab.addEventListener('click', () => switchTab(key));
      tabStrip.appendChild(tab);
    });
  }

  document.getElementById('nav-back')?.addEventListener('click', () => {
    const idx = PROJECT_ORDER.indexOf(currentTab);
    switchTab(PROJECT_ORDER[(idx - 1 + PROJECT_ORDER.length) % PROJECT_ORDER.length]);
  });
  document.getElementById('nav-fwd')?.addEventListener('click', () => {
    const idx = PROJECT_ORDER.indexOf(currentTab);
    switchTab(PROJECT_ORDER[(idx + 1) % PROJECT_ORDER.length]);
  });
  document.getElementById('nav-reload')?.addEventListener('click', () => switchTab(currentTab));

  switchTab(PROJECT_ORDER[0], { fast: true });

  /* ————————————————————— file explorer (Archivo) ————————————————————— */
  interface AssetGroup { title: string; files: string[]; zip?: string; }

  const ASSET_GROUPS: AssetGroup[] = [
    { title: 'Iconos del sistema', files: ['img/icons-win98/folder.png'], zip: 'iconos.zip' },
    { title: 'Fondo de escritorio', files: ['img/fondo.jpg'] },
    { title: 'SafeGram', files: ['img/safegram-mockup-1.png', 'img/safegram-mockup-2.png', 'img/safegram-mockup-3.png'], zip: 'safegram.zip' },
    { title: 'NutroVia', files: ['img/nutrovia/nutrovia_hero.png', 'img/nutrovia/nutrovia_dashboard.png', 'img/nutrovia/nutrovia_domains.png', 'img/nutrovia/nutrovia_pricing.png', 'img/nutrovia/nutrovia_login.png'], zip: 'nutrovia.zip' },
    { title: 'Identidad visual — NutroVia', files: ['visual-identity/Identidad visual Nutrovia Web App.pdf'] },
    { title: 'Buscaminas', files: ['img/buscaminas/javaw_mqSzgrWh3H.png', 'img/buscaminas/javaw_QoStHDSyzB.png', 'img/buscaminas/javaw_ccFvOPOd0p.png', 'img/buscaminas/javaw_w5zVqdFM3I.png'], zip: 'buscaminas.zip' },
    { title: 'Mandelbrot', files: ['img/mandelbrot_forkjoin.png'] },
  ];

  const explorerRoot = document.getElementById('explorer-root');
  if (explorerRoot) {
    explorerRoot.innerHTML = ASSET_GROUPS.map((group) => {
      const items = group.zip
        ? `
          <div class="explorer-item">
            <img src="${group.files[0]}" alt="${group.zip}" loading="lazy" />
            <span class="explorer-item__name">${group.zip}</span>
            <a class="explorer-item__dl" href="${group.zip}" download>Descargar ↓</a>
          </div>
        `
        : group.files
            .map((path) => {
              const name = path.split('/').pop() ?? path;
              const isPdf = path.toLowerCase().endsWith('.pdf');
              const thumb = isPdf
                ? `<span class="explorer-item__pdf" aria-hidden="true">PDF</span>`
                : `<img src="${path}" alt="${name}" loading="lazy" />`;
              return `
                <div class="explorer-item">
                  ${thumb}
                  <span class="explorer-item__name">${name}</span>
                  <a class="explorer-item__dl" href="${path}" download>Descargar ↓</a>
                </div>
              `;
            })
            .join('');
      return `
        <div class="explorer-section">
          <h4>${group.title}</h4>
          <div class="explorer-grid">${items}</div>
        </div>
      `;
    }).join('');
  }

  /* ————————————————————— terminal app ————————————————————— */
  const termOutput = document.getElementById('term-output');
  const termInput = document.getElementById('term-input') as HTMLInputElement | null;

  const typeLine = (text: string | null): void => {
    if (text === null || !termOutput) return;
    termOutput.textContent += `\n${text}\n`;
    termOutput.scrollTop = termOutput.scrollHeight;
  };

  const commands: Record<string, () => string | null> = {
    help: () => 'comandos: help, whoami, projects, skills, contact, open <proyecto>, sudo, clear',
    whoami: () => 'Eduardo Holanda Fernández — ingeniero de computadores.\nCiberseguridad · IA/LLM · productos web.',
    projects: () =>
      PROJECT_ORDER.map((k) => `${PROJECTS[k].tabLabel.padEnd(20)}[${PROJECTS[k].stack[0]}]`).join('\n') +
      '\n\nescribe "open <nombre>" para abrir el proyecto',
    skills: () => '>> cargando stack...\nciberseguridad ofensiva · modelos LLM · desarrollo web · automatización',
    contact: () => 'abriendo CONTACTO.EXE...',
    sudo: () => 'Nice try. Este visitante no está en el sudoers file. Este incidente será reportado.',
    clear: () => {
      if (termOutput) termOutput.textContent = '';
      return null;
    },
  };

  termInput?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Enter' || !termInput) return;
    const raw = termInput.value.trim();
    if (termOutput) termOutput.textContent += `\nvisitante@eduardo:~$ ${raw}`;
    const cmd = raw.toLowerCase();

    if (cmd.startsWith('open ')) {
      const target = cmd.slice(5).trim();
      if (PROJECTS[target]) {
        openWin('win-browser');
        switchTab(target);
        typeLine(`abriendo ${target}...`);
      } else if (target === 'contact' || target === 'contacto') {
        openWin('win-contact');
        typeLine('abriendo contacto...');
      } else if (target === 'about' || target === 'sobre_mi') {
        openWin('win-about');
        typeLine('abriendo sobre_mi...');
      } else {
        typeLine(`ventana no encontrada: ${target}`);
      }
    } else if (commands[cmd]) {
      typeLine(commands[cmd]());
      if (cmd === 'contact') openWin('win-contact');
    } else if (cmd !== '') {
      typeLine(`comando no reconocido: "${raw}" — escribe "help"`);
    }
    termInput.value = '';
    if (termOutput) termOutput.scrollTop = termOutput.scrollHeight;
  });

  /* ————————————————————— contact form (Web3Forms) ————————————————————— */
  const win = window as unknown as { WEB3FORMS_ACCESS_KEY?: string };
  const contactForm = document.getElementById('contact-form') as HTMLFormElement | null;
  const contactStatus = document.getElementById('contact-status');

  if (contactForm) {
    const accessKey = win.WEB3FORMS_ACCESS_KEY ?? '';
    const configured = accessKey.length > 0 && !accessKey.startsWith('PEGA_AQUI');

    contactForm.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      if (!contactStatus) return;

      const fd = new FormData(contactForm);
      const name = String(fd.get('name') ?? '').trim();
      const email = String(fd.get('email') ?? '').trim();
      const message = String(fd.get('message') ?? '').trim();

      if (!name || !email || !message) {
        contactStatus.textContent = 'Rellena todos los campos, por favor.';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        contactStatus.textContent = 'Escribe un email válido.';
        return;
      }
      if (!configured) {
        contactStatus.textContent = 'El formulario aún no está conectado. Escríbeme a edward.15.holanda@gmail.com';
        return;
      }

      contactStatus.textContent = 'Enviando...';
      const botcheck = String(fd.get('botcheck') ?? '');
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: 'Nuevo mensaje desde eduardo.OS',
          from_name: name,
          replyto: email,
          email,
          message,
          botcheck,
        }),
      })
        .then((res) => res.json())
        .then((data: { success?: boolean }) => {
          if (!data || data.success !== true) throw new Error('Web3Forms rejected the submission');
          contactStatus.textContent = '¡Mensaje enviado! Te responderé pronto.';
          contactForm.reset();
        })
        .catch(() => {
          contactStatus.textContent = 'No se pudo enviar. Inténtalo de nuevo o escríbeme por email.';
        });
    });
  }
})();
