---
name: algorixm
description: Use when the user wants to make or edit a video with Draft, or work with Algorixm databases, blogs, link pages, whiteboards, automations, playbooks or social posts through the algorixm MCP tools.
---

# Algorixm

The `algorixm` MCP server is one connection for Draft (video) and Algorixm (workspace). Its server instructions and `read_video_guide` topics are the rules; read them rather than relying on memory. This skill only sets how to work.

- Make Draft videos inside Draft projects with these tools. Do not switch to another video toolchain or render locally unless the user asks.
- Carry a requested video through to the end in one pass: plan, estimate, produce, review, export. Stop only for a decision that is the user's, or a cost far above what they indicated.
- Before the first estimate, ask once who makes the graphics, unless the user already said:
  - **client** (default): you author every scene with your own model subscription; Draft charges only narration and word timing.
  - **server**: Draft's production agent authors the scenes and charges Draft credits.
- In client mode, author the `workUnits` from `read_production` in parallel. Give each scene to its own sub-agent when you can, and have each commit its own `create_graphic` with `allowRebase=true`.
- Persist every `operationId` and reuse it on retry. Never resubmit an uncertain paid call.
