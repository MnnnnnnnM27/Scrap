<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- GlobalLayer owns app-wide shortcuts, document imports, dictation, and reconnect syncing, so these behave consistently across signed-in screens.
- Offline document snapshots and revisioned save queues are scoped to the signed-in account; persist edits before debounce and acknowledge only confirmed row updates to prevent loss and cross-account exposure.
- SplitPane edits a second document independently from the primary editor; global dictation targets the focused editor.
- Offline launch uses vite-plugin-pwa generateSW and a single guarded registrar; never register app-shell workers in development, iframe, or Lovable previews.
- Dock icon PNGs are deterministic renders of the ScrapMark path, keeping installed artwork identical to the in-app logo.
- Offline queue revisions increase per account even after acknowledgement; editor flushes sync staged entries instead of restaging stale patches to avoid overwriting newer edits.
- Split view places its two editors explicitly in grid tracks while fixed tool wrappers use display: contents, preventing empty toolbar rows from displacing either editor.
- Folder layout uses a dedicated device-local external store with same-tab and cross-tab notifications, independent of cloud settings loads; both layouts reuse one folder navigator so selection stays consistent without a schema change.
