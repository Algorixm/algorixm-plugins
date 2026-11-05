# Algorixm

**Create videos. Keep editing.**

Turn a brief into an editable Draft video from Claude Code or Codex. Work on motion graphics, scenes, captions and exports, then continue in the same browser editor. Algorixm also connects the content and automation work around your video: databases, blog and link pages, whiteboards and social publishing.

[한국어 안내](README.ko.md) · [Website](https://algorixm.com) · [Support](https://algorixm.com/contact)

## Try a concrete task

- “Create a 15-second product teaser in Draft and give me the editable project.”
- “Find my latest Draft project and summarize the scenes before we edit it.”
- “Change the opening title, keeping the timing and the rest of the design.”
- “Read my content calendar and suggest three ideas without publishing anything.”

The assistant can return the actual project, page or run link. Saved drafts, queued renders and published posts are distinct outcomes; the assistant should tell you which one it verified.

## What you can do

| Work | Typical result |
| --- | --- |
| Video creation and editing | Editable Draft projects with motion graphics and scene revisions |
| Export | Render requests, progress and completed output links |
| Workspace content | Database rows, blog/link-page views and whiteboard updates |
| Automation | Saved projects, test-run status and authorized activation |
| Social content | Authorized posts, schedules, comments and messages on connected channels |

## Connect your account

Install the plugin from the [repository instructions](https://github.com/Algorixm/algorixm-plugins#readme), start a new session and complete OAuth sign-in. In Claude Code, open `/mcp` to connect. The remote server is `https://algorixm.com/mcp`.

In Claude Code, you can install it in one step:

```bash
claude plugin install algorixm --marketplace Algorixm/algorixm-plugins
```

You need an existing Algorixm account. The connection can access businesses available to that account according to its current role; it is not restricted to a single video. Choose the intended business before changing content. Generation, media and rendering depend on account permissions and an existing credit balance. Social workflows also require a channel already connected in Algorixm.

This package contains task instructions, icons and connection metadata. It does not install a local server, download executable dependencies, run startup hooks or change your host's approval settings. Host permissions still apply.

## Data and external actions

Tool arguments and the content needed for your task are sent to Algorixm's HTTPS MCP service. Tool results are returned to the AI host. Video projects, uploaded media, workspace rows and automation state are stored in your Algorixm account. Requested generation may be processed by the configured AI/media providers, and authorized publishing sends the selected content to your connected social service. The plugin does not send your entire chat history or unrelated local files on its own.

Data handling and retention follow the [Algorixm privacy policy](https://algorixm.com/privacy). Remove the connection in your AI host to stop future tool access; that does not delete existing Algorixm projects. Use the product's deletion controls or [contact support](https://algorixm.com/contact) for account/data requests.

Making a video does not authorize posting it publicly. Publishing, recurring activation and destructive changes must match your request and the host's permissions. The plugin cannot expose Secret ENV values or provider tokens, connect social accounts, or purchase credits. Insufficient permissions or credits should be reported as a limitation.

## When something fails

- If no tools appear, start a new session and confirm the plugin is enabled in that host.
- If sign-in expires, reconnect through the host's MCP/OAuth controls. Never paste a password, token or verification code into chat.
- If a business is missing, check that the connected account has membership there.
- If a save conflicts, reread the current revision before retrying. After a timeout, check the project or run state before resubmitting paid or publishing work.
- For support, include the project/run ID and the visible error, without credentials.

[Terms](https://algorixm.com/terms) · [Privacy](https://algorixm.com/privacy) · [Support](https://algorixm.com/contact)

The files in this plugin are MIT licensed. Use of the hosted service is governed by its terms. Algorixm is the publisher; this package does not imply endorsement or directory approval by Anthropic or OpenAI.
