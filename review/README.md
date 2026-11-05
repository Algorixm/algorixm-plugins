# Directory review preparation

This folder describes the review scenarios; it is not a record of passed tests or an approved submission. Public package metadata contains the same eight cases in `plugin.json`.

## Reviewer fixture

Use a dedicated Algorixm review account and a business named **Plugin Review**, with sample data only. Do not give reviewers access to the owner's real business. The account must support immediate sign-in without a private MFA approval, magic link or email code. Enter credentials only in the provider's secure review form; never put them in this repository, screenshots or a demo recording.

Prepare an editable sample project named **Orbit Coffee — Launch** and a sample database named **Launch Calendar**. Orbit Coffee is fictional demo content. Use original graphics and sample rows with no real customer information. Keep review drafts and the fixture available for review and subsequent updates.

Run [test-cases.json](test-cases.json) with this account. The third positive case creates a new draft and the fourth edits it; run them in that order. These cases do not authorize paid generation, rendering or social publishing. Negative cases are model-behavior checks, not permission to probe another account or retrieve secrets.

## Capture the real workflow

Record login without credentials on screen, project discovery, block selection, title-card creation, the title revision appearing in Draft, and the sample calendar read. Show the refusal or safe fallback for the three negative cases. Include a completed render only if an actual authorized render is available, and identify it separately from the draft-only test cases.

Use actual application captures. Do not fabricate a successful tool call, output or directory approval. Keep the recording outside the installable plugin folder; provide a reviewer-accessible URL in `extensions.com.openai.review.demo_recording_url` once uploaded. Screenshots can be linked in the plugin README and optionally declared in the OpenAI interface metadata. OpenAI's current guidelines say screenshots are not shown in its directory, so starter prompts and the required review video carry the main demonstration.

## Submit each target

- **Anthropic:** submit the GitHub repository and `plugins/algorixm` folder from `https://claude.ai/directory/manage`. Use a stable reviewed branch or commit, validate, and inspect the listing and data handling answers. The remote MCP also needs its own connector submission. These are separate from `claude-plugins-official` partner placement.
- **OpenAI:** upload the complete ZIP at `https://platform.openai.com/plugins` with its MCP declaration present from the start. Verify the developer identity and MCP domain, connect OAuth, run metadata/skill/tool scans, supply the dedicated review credentials and demo, and submit the reviewed draft.

Submission does not imply approval or publication. Preserve the actual submission URL, status, commit/package checksum and any validation findings in a local work record. Do not accept new directory agreements or attest to unverified facts without the account owner's confirmation.

## Sources checked on 2026-11-05

- [OpenAI packaging](https://developers.openai.com/plugins/build/plugins)
- [OpenAI submission and review fields](https://developers.openai.com/plugins/deploy/submission)
- [OpenAI plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines)
- [Anthropic plugin submission](https://claude.com/docs/plugins/submit)
- [Anthropic pre-submission checks](https://claude.com/docs/plugins/pre-submission-checklist)

The live portal is the source of truth for account eligibility, required agreements and submission status.
