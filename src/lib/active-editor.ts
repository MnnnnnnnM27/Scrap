import type { Editor } from "@tiptap/react";

/** The editor currently open on screen, so global features (file drop, dictation) can insert into it. */
export const activeEditor: { current: Editor | null } = { current: null };
