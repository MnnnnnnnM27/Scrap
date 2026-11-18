# Scrap

A minimal, clean note-and-writing web app called Scrap, heavily inspired by the Mac app "Minimal Notes": no clutter, only the tools you actually need, fast, and beautiful. Full customization, but nothing overwhelming.

## CORE STRUCTURE — two content types, three modes

1. NOTES — quick, short-form notes. Own list on Home.

2. PAGES — long-form writing, like Apple Pages / Google Docs. Own list on Home.

3. RESEARCH MODE — not a document type. A standalone freeform "ask Gemini anything" research chat, opened from Home.

## HOME SCREEN (default view on launch)

- Shows two sections: "Notes" and "Pages" — combined view of everything, each as its own list/grid (cards with title + last-edited date + short preview).

- Search bar to filter across both.

- "+ New Note" and "+ New Page" actions, clearly distinct.

- A floating bubble button, bottom-left corner (icon only, no text) that opens Research Mode.

- Custom titles: every note and page has an editable title.

## RESEARCH MODE

- Clean chat interface for asking Gemini research questions directly — not attached to any note/page. Fast Q&A, no formatting tools.

- Reachable from Home via the bottom-left bubble, and from inside any Note/Page via the top-bar research icon.

## GLOBAL — SETTINGS

- A floating icon bubble, top-left corner of the screen (icon only, gear/settings icon) — visible on Home, Notes, Pages, and Research.

- Opens a Settings panel with:

  - **Font customization**: "Default" (matches Minimal Notes' own default font) plus a small curated set of alternate fonts to choose from.

  - **UI customization**: theme/accent color picker, and a Light Mode / Dark Mode toggle.

  - **Defaults**: Light Mode + "Dark Grey" theme.

  - **Adaptive theme behavior**: the selected accent theme adapts for visibility — e.g. the "Dark Grey" theme automatically renders as a lighter grey when the user is in Dark Mode, so it stays visible against the dark background, while still reading as "the same theme."

  - Theme color should be visible on UI elements — buttons, icons, floating bubbles, toggles — but should NOT be applied to the note/page writing surface itself (keep the canvas neutral/clean for writing).

## TOP BAR (visible when inside a Note or a Page — NOT on Home)

Right-aligned, in this exact order left → right:

1. Notes / Pages mode switcher (segmented control/toggle)

2. Home icon button (icon only, no text) — returns to Home

3. Research icon (magnifying-glass style, icon only, no text) — opens Research Mode

4. "✦ Ask Gemini" pill/bubble — Gemini icon to the LEFT of the text "Ask Gemini" — rightmost, most prominent element. Opens a contextual AI sidebar/bubble scoped to the current note or page (rewrite, summarize, continue writing, answer questions about the content).

## NOTES MODE — toolbar (minimal, floating side bubble)

- Headers (1-2 levels max, not a full H1-H6 system)

- Bullet & numbered lists

- Checklists / to-do items

- Bold/italic

- NO font family or font size controls — keep notes fast and opinionated.

## PAGES MODE — toolbar (floating side bubble, writer's toolkit)

- Font family selector + font size

- Headers (full range)

- Bullet & numbered lists

- Bold/italic/underline

- Text alignment

- NO checklists (Notes-only tool) — Pages is for prose.

## AI (use Lovable's built-in AI connector — Connectors → AI — default model Gemini, no API keys needed)

- Autocorrect/autocomplete as you type, in both Notes and Pages.

- "Ask Gemini" contextual bubble (top bar) — scoped to the open document.

- Research Mode — separate, general-purpose Gemini chat.

## SHARING & EXPORT — all free, no paywall

Every note/page can be exported as:

- Markdown (.md)

- .mnml (Minimal Notes' own format, opens directly in Minimal Notes)

- .docx (Word)

- .png (flattened image snapshot)

Every note/page can also be shared via a public link, opening in a strictly VIEW-ONLY read mode — no editing, no account required to view.

## ACCOUNTS & DATA

- Cloud sync with account login (email/password + Google sign-in via Lovable Cloud/Supabase auth), notes/pages available across devices.

- Use Lovable Cloud for the database (users, notes, pages, shared-link tokens) and Supabase Storage for exported files if needed.

## DESIGN LANGUAGE

- Minimal, clean, uncluttered — Apple-native feel, Liquid Glass-inspired translucent surfaces (subtle blur/glass on the top bar and floating bubbles).

- Support light and dark mode, per the Settings behavior above.

- Typography: clean, characterful sans-serif as the app's own default (Switzer or Instrument Sans) — separate from the user-selectable "Default (Minimal Notes font)" option inside notes/pages.

- Generous whitespace, no visual noise. Icons only where labeled above as icon-only; everything else can have subtle labels.

- Fully responsive — shared view-only links need to look polished on any screen.

Build in plan mode first — lay out the data model (users, notes, pages, shared-link tokens, user settings) and screen flow before generating code.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://scrapnotes.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/91d0bb9f-1011-4598-bf9a-94f01f5ebd53).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
