# Draft video workflow

## Pick the right operation

Read an existing project's current state before editing. For a new video, choose reasonable duration, aspect ratio, tone and design from the user's brief; ask when a missing subject, budget or deliverable materially affects the work. Preserve supplied scripts and creative constraints.

Load the live guide's story, storyboard and production topics when planning. Choose graphics authored by the host (`graphics=client`) when available and appropriate. Server-authored graphics use Draft's production service and credits. Do not describe a client's model subscription as covering voice, media or render costs.

Return the tool-provided `editorUrl` promptly. Open it only through a browser surface permitted by the host; otherwise give the user the link. Never open unrelated tabs or start an alternative browser to bypass host restrictions.

## Author and review

1. Define a coherent visual direction and storyboard; read the live look, motion, captions and sound guides as needed.
2. Search `search_graphic_blocks` for relevant titles, charts, transitions or device/UI components and read only the selected blocks. Adapt them to the brief rather than copying a preset indiscriminately.
3. Make and inspect a reference scene, then author the remaining scenes. If independent workers are available and authorized, give each one a distinct scene, shared design direction, and its own operation identity. Otherwise work sequentially. Do not assume every host supports delegation.
4. Use `edit_video` with the current `create_graphic` or `edit_graphic` operation schema; these are operations, not separate MCP tools. Read existing HTML through `read_source`. Preserve operation and revision identities. Rebase only an operation the API supports safely; reread after a conflict rather than overwriting unrelated edits.
5. Read the review guide and inspect scenes in Draft's permitted preview surface: layout, clipping, motion, narration, captions, audio and timing. API validation alone does not prove visual or audio quality.
6. When export is requested and authorized, request the render and check `read_renders` until completion or an actionable failure. Return the actual result URL. A queued render is not a completed MP4.

If visual or audio inspection is unavailable, say which checks are unverified. Do not invent a successful playback, listening check, parallel run, or completed export. Keep social publishing separate from export unless the user requested both.
