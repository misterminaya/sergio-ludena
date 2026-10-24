# Sitio web de Sergio Ludeña Visalot — prototipo estático

Prototipo HTML/CSS/JS sin build step, pensado para convertirse en un tema clásico de WordPress.
Abre `index.html` directamente en el navegador o sirve la carpeta con cualquier servidor estático
(por ejemplo `python3 -m http.server`).

## Páginas

| Archivo HTML             | Plantilla PHP      | Qué muestra                                                   |
|--------------------------|--------------------|---------------------------------------------------------------|
| `partials/header.html`   | `header.php`       | Skip link, sprite SVG de íconos, header fijo con menú          |
| `partials/footer.html`   | `footer.php`       | Footer (nombre, menú breve, redes, correo, ©) y script         |
| `partials/sidebar.html`  | `sidebar.php`      | Barra lateral del artículo: autor, más artículos, categorías   |
| `index.html`             | `front-page.php`   | Landing: hero, cita, trayectoria, opinión, redes, contacto     |
| `opinion.html`           | `home.php`         | Listado de entradas (página de entradas "Opinión") con paginación |
| `opinion-articulo.html`  | `single.php`       | Detalle de una entrada con `.entry-content` y botones de compartir |
| `404.html`               | `404.php`          | Página de error                                               |
| `assets/css/main.css`    | `style.css`        | Hoja de estilos única (variables en `:root`)                   |
| `assets/js/main.js`      | `assets/js/main.js`| JS vanilla encolado con `wp_enqueue_script` (defer)            |
| `assets/img/`            | Biblioteca de medios | Placeholders SVG (foto principal, destacadas)                |

Las cuatro páginas incluyen el contenido de `partials/header.html` y `partials/footer.html` copiado
literalmente. En WordPress se reemplazan por `get_header()` y `get_footer()`. Si editas un partial,
vuelve a pegarlo en las cuatro páginas (o regenera con el script de ensamblado descrito al final).

## Zonas dinámicas (marcadas con `<!-- WP: ... -->`)

### Globales (header / footer)
- Nombre del sitio → `bloginfo('name')`, enlace a `home_url('/')`.
- Menú principal (Inicio, Trayectoria, Opinión, Contacto) → `wp_nav_menu('principal')`. Los ítems llevan `data-section` para resaltar la sección activa en la landing.
- Menú del pie → `wp_nav_menu('pie')`.
- URLs de redes (Facebook, Instagram, LinkedIn, X, TikTok) → opciones del Personalizador (`get_theme_mod`).
- Correo de contacto → `get_theme_mod('contacto_email')`.
- Año del copyright → `date('Y')`.
- `<title>` y meta description → `add_theme_support('title-tag')` + plugin SEO o función propia.
- Open Graph y Twitter Card → por página; en `single.php` con título, extracto e imagen destacada de la entrada. Ver "Compartir en redes".
- JSON-LD `Person` (solo en la portada) → salida en `wp_head` con `sameAs` tomado de las redes del Personalizador.

### Portada (`front-page.php`)
- Hero: h1 (nombre), subtítulo (`bloginfo('description')`), extracto institucional, foto principal (sin lazy, es la imagen LCP).
- Cita directiva y firma.
- Perfil profesional (3 párrafos) y panel "En síntesis" con datos clave del brief (campos etiqueta + valor).
- Línea de tiempo (6 cargos clave) → campos repetibles o HTML de la portada.
- Acordeones: Experiencia completa, Formación académica, Especializaciones y certificaciones, Trayectoria deportiva.
- Opinión → `WP_Query` con `posts_per_page => 3`; cada card usa `the_time`, `the_category`, `the_title`, `the_excerpt`, `the_post_thumbnail`.
- Botón "Ver todas" → `get_permalink( get_option('page_for_posts') )`.
- Redes → cada tarjeta es un enlace (`<a class="social-card">`) con URL del Personalizador; "Seguir" es texto dentro del enlace. Sin feeds ni scripts de terceros.
- Contacto: texto introductorio, correo y formulario. `action="#"` es provisional; el envío real se resuelve con `wp_mail` (nonce + `admin-post.php`) o un plugin de formularios.

### Listado (`home.php`)
- Título y descripción de la página de entradas.
- The Loop con cards (fecha, categoría, titular, extracto, imagen destacada opcional).
- Paginación → `the_posts_pagination()`.

### Entrada (`single.php`)
- Fecha, categoría, título, entradilla (extracto), imagen destacada con caption.
- `the_content()` dentro de `.entry-content` (h2, h3, párrafos, listas, blockquote, imagen con figcaption, tabla, video embebido, enlaces, alineaciones de WP).
- Botones de compartir (LinkedIn, X, Facebook, WhatsApp) construidos con `get_permalink()` y `get_the_title()`, sin scripts.
- "Volver a Opinión" → `get_permalink( get_option('page_for_posts') )`.
- Sidebar (`get_sidebar()`): tarjeta de autor (foto, redes), "Más artículos" (`WP_Query` excluyendo la entrada actual) y categorías (`wp_list_categories`). Fija al hacer scroll desde 1024 px; debajo del contenido en móvil.

## Compartir en redes (Open Graph / Twitter Card)

Cada artículo lleva en el `<head>` todo lo que Facebook, LinkedIn, X y WhatsApp leen al generar la tarjeta:
`og:title`, `og:description`, `og:url`, `og:image` (con `width`, `height`, `type` y `alt`),
`article:published_time`, `article:section`, `twitter:card = summary_large_image`, `twitter:title`,
`twitter:description`, `twitter:image`, `<link rel="canonical">` y un JSON-LD de tipo `Article`.

Reglas para que la tarjeta salga con imagen:
- La imagen debe ser **JPG o PNG de 1200×630** (relación 1.91:1). Las redes no renderizan SVG.
- Todas las URLs deben ser **absolutas y públicas** (dominio real, HTTPS). En el prototipo se usa `https://sergioludena.com/` como supuesto.
- Las imágenes de ejemplo están en `assets/img/og-*.png`.

En WordPress:
- Registrar el tamaño en `functions.php`: `add_image_size( 'og', 1200, 630, true );`
- Imprimir las etiquetas en `wp_head` con `get_the_title()`, `get_the_excerpt()`, `get_permalink()` y
  `get_the_post_thumbnail_url( null, 'og' )`; si la entrada no tiene imagen destacada, usar `og-default.png`.
- Alternativa: un plugin SEO (Yoast, Rank Math) genera las mismas etiquetas desde la imagen destacada.
- Tras publicar, validar con el depurador de Facebook, el Post Inspector de LinkedIn o el Card Validator de X;
  si cambias la imagen, hay que forzar el refresco de caché en esas herramientas.

## Comportamiento JS (`assets/js/main.js`)
- Header fijo que se compacta al hacer scroll (`.is-scrolled`).
- Menú hamburguesa accesible (`aria-expanded`, cierre con Esc, clic fuera y al elegir un enlace).
- Resaltado de la sección activa en la landing con `IntersectionObserver`.
- Acordeones con `button` + `aria-expanded` + `aria-controls`, cerrados por defecto.
- Validación del formulario con mensajes `aria-live` y `aria-invalid`.
- Acordeones con apertura y cierre animados (altura con `grid-template-rows`), `hidden` se aplica al terminar la transición.
- Revelado sutil al hacer scroll, entrada escalonada de cards y tarjetas, raya de sección que se dibuja al aparecer y entrada orquestada del hero al cargar. Todo desactivado con `prefers-reduced-motion`.
- Todo degrada sin JS: el contenido sigue siendo accesible.

## Notas de contenido
- Los textos de hero, cita, perfil, experiencia, formación, especializaciones, trayectoria deportiva y contacto son los del brief, sin cambios.
- Los 6 artículos de Opinión y la tabla del artículo son contenido de ejemplo para el prototipo.
- Las imágenes son SVG de marcador de posición con las dimensiones declaradas en `width`/`height`.

## Regenerar las páginas a partir de los partials
Los archivos fuente de cada página (sin header ni footer) están en `partials/pages/`.
Para volver a ensamblar una página con los partials actuales:

```bash
sed -e '/<!--@HEADER@-->/{r partials/header.html' -e 'd}' \
    -e '/<!--@SIDEBAR@-->/{r partials/sidebar.html' -e 'd}' \
    -e '/<!--@FOOTER@-->/{r partials/footer.html' -e 'd}' \
    partials/pages/index.html > index.html
```

Donde `partials/pages/index.html` contiene las marcas `<!--@HEADER@-->`, `<!--@FOOTER@-->` y, en el artículo, `<!--@SIDEBAR@-->` en lugar de los partials.

## Siguiente paso
Convertir a tema clásico de WordPress: `style.css`, `functions.php`, `header.php`, `footer.php`,
`front-page.php`, `home.php`, `single.php`, `404.php`. Los artículos de Opinión serán Entradas.
