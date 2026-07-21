# Avatar gradient frame — design

## Goal

Add a circular soft gradient rim around the portrait on the personal landing page, with motion only on hover/focus.

## Decisions

- **Shape:** circular avatar (`border-radius: 50%`), keep 180×180 photo size.
- **Rim:** soft conic/linear gradient in existing olive/accent palette (`--accent` and nearby greens). No purple, no strong glow.
- **Thickness:** ~3–4px via padding on a wrapper.
- **Motion:** slow gradient rotation (~8–12s per turn) only on `:hover` / `:focus-within`. Disabled under `prefers-reduced-motion: reduce`.
- **Structure:** wrapper `div.page__photo-frame` around existing `img.page__photo` (`tabindex="0"` on the frame for keyboard focus).
- **Shatter:** leave `space-shatter.js` unchanged; it continues to bind `pointerdown` on `.page__photo`.

## Files

- `index.html` — wrap photo in `.page__photo-frame`
- `src/less/common.less` — frame styles; move entrance animation/margin to the frame
- `dist/css/common.css` — keep in sync (GitHub Pages serves dist)

## Non-goals

- No SVG assets, no new dependencies, no JS changes
- No redesign of name/role/email or page background
