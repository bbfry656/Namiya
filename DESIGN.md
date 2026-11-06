# NAMIYA UI conventions

Use the shared `ui.css` controls throughout the site and administration pages.
Close buttons use the `close-control` class: a quiet circular surface and thin CSS strokes, with a descriptive `aria-label`.
Scrollbars are narrow, rounded, and have transparent tracks without arrow buttons, inspired by macOS.
File inputs use the shared `.upload-zone` presentation, with drag-and-drop, a file summary, and keyboard access. Avoid visible native file picker buttons. Administration uses the same Manrope and Cormorant typography as the portfolio.
Keep keyboard focus visible and respect reduced motion and forced color preferences.
Administrator editing belongs on the normal portfolio page, with fixed controls and overlays that preserve the page's layout and scroll position. Use editable text spans, private drafts, explicit save actions, and drag handles for gallery and story ordering. Decorative icons must be consistent SVG/CSS, including on mobile; do not use emoji glyphs as interface icons.
