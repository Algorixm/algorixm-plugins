# Algorixm

**Create a video in your AI conversation. Keep editing it in Draft.**

This repository packages Algorixm's remote MCP connection and task guidance for Claude Code and Codex. Video projects, graphics, captions and exports stay in Draft; databases, content and automations stay in your Algorixm workspace.

See the [plugin guide](plugins/algorixm/README.md) for capabilities, account requirements, data handling and example prompts. [한국어 안내](plugins/algorixm/README.ko.md)

## Claude Code

```bash
claude plugin marketplace add Algorixm/algorixm-plugins
claude plugin install algorixm@algorixm
```

Start a new session and use `/mcp` to sign in to Algorixm. The plugin keeps Claude's normal permission controls and includes no automatic approval hook.

## Codex

```bash
codex plugin marketplace add Algorixm/algorixm-plugins
codex plugin add algorixm@algorixm
```

Start a new session and complete Algorixm OAuth sign-in when prompted. If your Codex surface does not load marketplace plugins, use the direct MCP connection below. Marketplace distribution does not imply approval in either provider's public directory.

## Direct MCP connection

The production endpoint is `https://algorixm.com/mcp` (Streamable HTTP).

```bash
# Claude Code
claude mcp add --transport http algorixm https://algorixm.com/mcp
# Then sign in through /mcp.

# Codex
codex mcp add algorixm --url https://algorixm.com/mcp
codex mcp login algorixm
```

Use either the plugin or the direct MCP connection for a host, to avoid duplicate tool registrations. OAuth works without copying API keys into chat or configuration examples.

## Maintainers

The shared skill is in `plugins/algorixm/skills/algorixm/`. `plugin.json` and `mcp.json` provide the portable OpenAI package; `.claude-plugin/plugin.json` and `.mcp.json` provide the Claude package. Both point to the same service.

```bash
claude plugin validate plugins/algorixm --strict --profile directory
python3 scripts/package.py
```

The packager validates local file paths and listing metadata, creates a deterministic ZIP in `dist/`, and prints its SHA-256. These checks do not prove OAuth, live tool execution, portal acceptance or review approval. See [review preparation](review/README.md) for submission evidence.
