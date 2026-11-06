# NAMIYA UI conventions

Use the shared `ui.css` controls throughout the site and administration pages.
Close buttons use the `close-control` class: a quiet circular surface and thin CSS strokes, with a descriptive `aria-label`.
Scrollbars are narrow, rounded, and have transparent tracks without arrow buttons, inspired by macOS.
File inputs use the shared `.upload-zone` presentation, with drag-and-drop, a file summary, and keyboard access. Avoid visible native file picker buttons. Administration uses the same Manrope and Cormorant typography as the portfolio.
Keep keyboard focus visible and respect reduced motion and forced color preferences.
Administrator editing belongs on the normal portfolio page, with fixed controls and overlays that preserve the page's layout and scroll position. Use editable text spans, private drafts, explicit save actions, and drag handles for gallery and story ordering. Decorative icons must be consistent SVG/CSS, including on mobile; do not use emoji glyphs as interface icons.
The journal can switch to a free editorial composition on large screens: independent card positions and widths, optional text blocks, bounded movement, undo, and reset. Keep a linear readable flow on small screens. Edits remain private until saved. Edit-mode jiggle uses subtle 0.13-second alternating rotations and stops while dragging or when reduced motion is requested.
Inside photo stories, show the complete photograph with its original aspect ratio. Never apply cover cropping or a forced aspect ratio to reader photographs. Editor thumbnails must also show the full frame.
Photographic aesthetic reference: the public Maxim Volodin (@maximvo) portfolio grid. Interpret its documentary/editorial restraint through warm paper, graphite ink, larger images, quiet typography and varied visual rhythm. Preserve the photographer's original color grading; do not apply saturation filters or reuse reference photographs.
