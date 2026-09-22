# Scrap — Build Plan

A minimal note-and-writing app inspired by Minimal Notes: Notes (short-form), Pages (long-form), and a standalone Research chat, with Gemini-powered assistance, free export/sharing, and cloud sync.

## Screen flow

```text
/auth ──────────────► /  (Home)
                       ├── Notes list  ──► /note/:id   (editor, top bar, Notes toolbar bubble)
                       ├── Pages list  ──► /page/:id   (editor, top bar, Pages toolbar bubble)
                       ├── Search bar (filters both lists)
                       ├── + New Note / + New Page
                       └── bottom-left bubble ──► /research   (general Gemini chat)

Everywhere (Home, Note, Page, Research): top-left gear bubble ──► Settings panel (sheet)
Inside Note/Page: top bar [Notes|Pages] [Home] [Research] [✦ Ask Gemini] ──► contextual AI sidebar
Public:            /s/:token  ──► read-only rendered document (no login, responsive)
```

## Data model (Lovable Cloud)

- **profiles** — id (= auth user), display_name, created_at. Auto-created on signup.
- **documents** — one table for both types: id, user_id, kind (`note` | `page`), title, content (JSON, editor document), plain_text (for search + previews), created_at, updated_at. Owner-only access.
- **share_links** — id, document_id, token (unique, random), created_at, revoked_at. Owner manages; a security-definer function `get_shared_document(token)` returns title/content/kind for public view-only reads (no direct public table access).
- **user_settings** — user_id, font (`default` | curated key), accent_theme (default `dark-grey`), color_mode (`light` | `dark`, default `light`), updated_at.
- **Auth** — email/password + Google sign-in via Lovable Cloud.

## Features by phase

### Phase 1 — Foundation, design system, Home
- Enable Lovable Cloud; auth page (email/password + Google); signup creates profile + default settings.
- Design system in `styles.css`: Instrument Sans as app UI font; glass surface tokens (blur, translucency, hairline borders); accent token set for 6 curated themes (Dark Grey default, plus e.g. Blue, Green, Orange, Rose, Indigo), each with a light-mode and dark-mode value so "Dark Grey" renders as light grey in dark mode. Accent applies to buttons, icons, bubbles, toggles — never to the writing canvas.
- Home: Notes + Pages card grids (title, last edited, preview), search, New Note / New Page, bottom-left Research bubble, top-left Settings bubble.
- Settings sheet: font picker (Default = Minimal Notes-style system font + 4–5 curated alternates), accent picker, Light/Dark toggle. Persisted to `user_settings`, applied instantly.

### Phase 2 — Editors
- Rich text editor (TipTap) with autosave (debounced) to `documents`.
- Editable title in both modes.
- Top bar (glass, right-aligned, exact order): Notes/Pages segmented switcher, Home icon, Research icon, "✦ Ask Gemini" pill.
- Notes toolbar bubble: H1/H2, bullet, numbered, checklist, bold, italic.
- Pages toolbar bubble: font family, font size, H1–H6, bullet, numbered, bold, italic, underline, alignment. No checklists.
- Notes/Pages switcher: from a note, switches to Pages list context (and vice versa) rather than converting the document.

### Phase 3 — AI (Lovable AI, Gemini, server-side)
- **Ask Gemini sidebar**: scoped to the open document; quick actions (Rewrite, Summarize, Continue writing) plus free questions; streaming; "Insert" / "Replace selection" for results.
- **Research Mode**: standalone streaming chat, no document context, no formatting tools. Session kept locally per visit.
- **Autocomplete as you type**: after a short typing pause, request a short ghost-text continuation; Tab accepts, keep typing dismisses. Light spell-fix suggestions surface the same way.

### Phase 4 — Export & sharing
- Export menu on every document: Markdown, `.mnml`, `.docx`, `.png` — all client-side, free.
- Share: generate/revoke a public link; `/s/:token` renders a polished read-only view with the document's font, fully responsive.

## Technical notes

- Stack: TanStack Start, Tailwind v4 tokens, shadcn primitives, TipTap editor, Lovable Cloud (auth + Postgres with RLS), Lovable AI gateway via server routes/functions (streaming chat routes for Ask Gemini and Research; a server function for autocomplete).
- `.mnml` format: Minimal Notes' native format is not publicly documented; the export will be a JSON/Markdown-based file with a `.mnml` extension. If you have a sample `.mnml` file, share it and I will match it exactly.
- `.docx` built client-side with the `docx` library; `.png` via `html-to-image` snapshot of the rendered document.
- Google sign-in uses Lovable Cloud's managed Google provider (no keys needed).
- Public view: no login required; only the security-definer lookup by token is exposed, so private documents stay private.
