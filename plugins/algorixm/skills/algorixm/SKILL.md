---
name: algorixm
description: Use when the user wants a video made or edited with Draft, or wants to work with Algorixm databases, blogs, link pages, whiteboards, automations, playbooks or social posts through the algorixm MCP tools.
---

# Algorixm

The `algorixm` MCP server is one connection for Draft (video) and Algorixm (workspace). Its instructions and `read_video_guide` topics are the rules; read them rather than relying on memory. This skill sets how to work.

- Video quality comes first. Make Draft videos inside Draft projects with these tools; do not switch to another video toolchain or render locally.
- A request for a video is a request for the finished video. Ask only when the subject itself is missing. Decide length, format, tone, voice and design yourself, and report those choices at the end.
- As soon as the project exists, open its `editorUrl` in the user's browser so they watch it being made.
- Author the graphics yourself (`graphics=client`) unless the user asks Draft to make them. Fix one design system, author the first scene as the reference, then give each remaining work unit to its own sub-agent and have each commit its own `create_graphic` with `allowRebase=true`.
- Check `search_graphic_blocks` before hand-building charts, kinetic titles, lower thirds, transitions, code, UI or device mockups, and adapt what fits.
- Review every scene in the browser before exporting, then export and report.
- Persist every `operationId` and reuse it on retry. Never resubmit an uncertain paid call.
