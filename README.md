# Field Theory CLI

Sync and store locally all of your X/Twitter bookmarks. Search, classify, and make them available to Claude Code, Codex, or any agent with shell access.

Free and open source. Designed for Mac, with experimental support for Linux and Windows.

## Install

```bash
npm install -g fieldtheory
```

## Quick start

```bash
# 1. Sync your bookmarks (needs Chrome logged into X)
ft sync

# 2. Browse them interactively (needs fzf)
ft browse

# 3. Search them
ft search "distributed systems"

# 4. Explore trends
ft viz
ft categories
ft stats
```

On first run, `ft sync` extracts your X session from Chrome and downloads your bookmarks into `~/.ft-bookmarks/`.

## Commands

### Sync

| Command | Description |
|---------|-------------|
| `ft sync` | Download and sync bookmarks (no API required) |
| `ft sync --rebuild` | Full history crawl (not just incremental) |
| `ft sync --gaps` | Backfill missing quoted tweets and expand truncated articles |
| `ft sync --classify` | Sync then classify new bookmarks with LLM |
| `ft sync --api` | Sync via OAuth API (cross-platform) |
| `ft auth` | Set up OAuth for API-based sync (optional) |

### Search and browse

| Command | Description |
|---------|-------------|
| `ft search <query>` | Full-text search with BM25 ranking |
| `ft browse` | Interactive browser with live preview (needs `fzf`) |
| `ft viz` | Terminal dashboard with sparklines, categories, and domains |
| `ft list` | Filter by author, date, category, domain |
| `ft show <id>` | Show one bookmark in detail |
| `ft show <id> --open` | Show details and open in your default browser |
| `ft sample <category>` | Random sample from a category |
| `ft stats` | Top authors, languages, date range |
| `ft categories` | Show category distribution |
| `ft domains` | Subject domain distribution |

### Classification

| Command | Description |
|---------|-------------|
| `ft classify` | Classify by category and domain using LLM |
| `ft classify --regex` | Classify by category using simple regex |
| `ft classify-domains` | Classify by subject domain only (LLM) |
| `ft model` | View or change the default LLM engine |

### Knowledge base

| Command | Description |
|---------|-------------|
| `ft md` | Export bookmarks as individual markdown files |
| `ft wiki` | Compile a Karpathy-style interlinked knowledge base |
| `ft ask <question>` | Ask questions against the knowledge base |
| `ft ask <question> --save` | Ask and save the answer as a concept page |
| `ft lint` | Health-check the wiki for broken links and missing pages |
| `ft lint --fix` | Auto-fix fixable wiki issues |

### Agent integration

| Command | Description |
|---------|-------------|
| `ft skill install` | Install `/fieldtheory` skill for Claude Code and Codex |
| `ft skill show` | Print skill content to stdout |
| `ft skill uninstall` | Remove installed skill files |

### Utilities

| Command | Description |
|---------|-------------|
| `ft index` | Rebuild search index from JSONL cache (preserves classifications) |
| `ft fetch-media` | Download media assets (static images only) |
| `ft status` | Show sync status and data location |
| `ft path` | Print data directory path |

## Agent integration

Install the `/fieldtheory` skill so your agent automatically searches your bookmarks when relevant:

```bash
ft skill install     # Auto-detects Claude Code and Codex
```

Then ask your agent:

> /fieldtheory show me my bookmarks about postgres
> /fieldtheory summarize what @steipete has been bookmarking lately

## Browser support

Field Theory extracts session cookies from your browser to access the GraphQL API. The following browsers are supported for automatic session extraction:

| OS | Supported Browsers |
|----|--------------------|
| **macOS** | Google Chrome, Google Chrome Canary, Arc, Microsoft Edge, Brave, Vivaldi |
| **Linux** | Google Chrome (requires `secret-service`, e.g. GNOME Keyring or KWallet) |
| **Windows** | Google Chrome, Microsoft Edge (requires PowerShell 5.1+) |

If your browser is not supported, or you want to use the CLI on a headless server, use `ft auth` and `ft sync --api`.

## Local data

Your data stays local. By default, it's stored in `~/.ft-bookmarks/`:
- `bookmarks.jsonl`: Raw JSON data from X (source of truth)
- `bookmarks.db`: SQLite database for fast search and aggregation
- `bookmarks-meta.json`: Sync history and total counts
- `.env`: (Optional) CLI configuration

### Permissions (macOS)

The first time you run `ft sync`, macOS will ask for permission to access your Chrome Safe Storage key in your Keychain. Select **"Always Allow"** to avoid being prompted on every sync.

If you accidentally selected "Allow" (which only grants access once), you can fix it in Keychain Access (search for "Chrome Safe Storage", right-click → Get Info → Access Control → add `node`).

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
