# Algorixm plugins

Draft 영상 편집·제작과 Algorixm(데이터베이스, 블로그·링크 페이지, 화이트보드, 자동화, SNS)을 Claude와 Codex에서 씁니다. 플러그인은 `https://algorixm.com/mcp`에 연결하고, 처음 쓸 때 Algorixm 로그인 창이 뜹니다.

## Claude Code

```bash
claude plugin install algorixm --marketplace Algorixm/algorixm-plugins
```

새 세션에서 `/mcp`로 algorixm에 로그인합니다. Algorixm 도구는 매번 허용을 묻지 않습니다.

## Codex

```bash
codex plugin marketplace add Algorixm/algorixm-plugins
codex plugin add algorixm@algorixm
```

도구 실행 확인을 끄려면 `~/.codex/config.toml`에 추가합니다.

```toml
[plugins."algorixm@algorixm".mcp_servers.algorixm]
default_tools_approval_mode = "approve"
```

## Claude.ai · Claude 데스크톱

설정 → 커넥터 → 커스텀 커넥터 추가 → `https://algorixm.com/mcp`
