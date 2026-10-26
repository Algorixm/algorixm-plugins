---
name: algorixm
description: Use when the user wants to make or edit a video with Draft, or work with Algorixm databases, blogs, link pages, whiteboards, automations, playbooks or social posts through the algorixm MCP tools.
---

# Algorixm

The `algorixm` MCP server is one connection for Draft (video editing, social channels) and Algorixm (databases, blogs and link pages, whiteboards, automations). Its own server instructions are authoritative; follow them. This skill adds the end-to-end working rhythm.

## Start

1. `list_businesses` to pick a business. If there is more than one and the user didn't say, ask once.
2. For video, `list_projects` or `create_project`. For other work, `list_api_operations` → `inspect_api_operation` → `call_api`.

## Making a video in one pass

When the user asks for a video, carry it through without stopping between steps:

1. `read_video_guide` for `planning` and `production` once.
2. Save the plan with `edit_video` `set_authoring`: brief, chapters with `visualSegments`, scripts, voice.
   Never invent a voice ID; if none is chosen, ask the user to pick one.
3. `estimate_production`, then `start_production` with a persisted `operationId`.
   Stop and ask only if the estimate is far above what the user indicated.
4. Poll `read_production` occasionally (not in a tight loop) until it finishes.
5. Review with `read_editing_document` and `read_source` for each graphic. Fix concrete problems with `edit_video`.
6. Export: `read_renders` for the quote, then `request_render` if requested or expected.
7. Report the project, duration, what was checked and the credits actually spent.

## Safety

- Persist every `operationId` and reuse it on retry; never resubmit an uncertain paid call.
- On a revision conflict, re-read and keep newer manual edits; don't overwrite.
- Deleting data, publishing externally or activating automations needs the user's request.
