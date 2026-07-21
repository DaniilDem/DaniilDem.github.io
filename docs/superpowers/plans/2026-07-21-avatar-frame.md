# Avatar Gradient Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Circular portrait with a soft olive gradient rim; slow rim rotation only on hover/focus.

**Architecture:** Wrap `.page__photo` in `.page__photo-frame`. Rim is a `::before` conic-gradient behind the circular image. Entrance animation moves to the frame. Shatter JS stays on `.page__photo`.

**Tech Stack:** HTML, LESS → `dist/css/common.css` (manual sync), no new deps.

## Global Constraints

- Photo remains 180×180px; rim ~3px
- Palette: existing `--accent` / olive greens only
- No JS changes; no purple/glow aesthetics
- Honor `prefers-reduced-motion: reduce`
- Keep `dist/css/common.css` in sync with `src/less/common.less`

---

### Task 1: Wrap photo in HTML

**Files:**
- Modify: `index.html`

**Interfaces:**
- Produces: `.page__photo-frame` wrapper with `tabindex="0"` containing `.page__photo`

- [ ] **Step 1: Wrap the portrait img**

```html
<div class="page__photo-frame" tabindex="0">
    <img
        class="page__photo"
        src="dist/images/portrait.jpg"
        alt="Daniil Demchenko"
        width="460"
        height="460"
        decoding="async"
        fetchpriority="high"
    >
</div>
```

- [ ] **Step 2: Visual check** — page still loads; photo visible (unstyled ring until Task 2)

---

### Task 2: Frame styles in LESS + dist CSS

**Files:**
- Modify: `src/less/common.less`
- Modify: `dist/css/common.css`

**Interfaces:**
- Consumes: `.page__photo-frame` from Task 1
- Produces: circular clipped photo, gradient rim, hover/focus spin, reduced-motion off

- [ ] **Step 1: Replace `.page__photo` block and add frame styles** (see implementation in session)

Key rules:
- Frame: `186×186`, `padding: 3px`, `border-radius: 50%`, owns `margin-bottom` + `fade-up`
- `::before`: full inset conic-gradient, `z-index: 0`
- Photo: `width/height 100%`, `border-radius: 50%`, `z-index: 1`, no entrance animation
- Hover/focus-within: `photo-frame-spin` ~10s linear infinite on `::before`
- Update settled/rebuilding/reduced-motion selectors to use `.page__photo-frame`

- [ ] **Step 2: Mirror the same rules in `dist/css/common.css`**

- [ ] **Step 3: Manual verify** — open page, confirm round photo + rim; hover spins; Tab focuses frame; shatter still works on photo tap; reduced-motion disables spin

---

### Task 3: Docs already written

Spec: `docs/superpowers/specs/2026-07-21-avatar-frame-design.md`  
Plan: this file

No commit unless the user asks.
