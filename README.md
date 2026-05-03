# GitHub Top Contributors SVG

A zero-dependency, single-file Vercel serverless API that fetches a GitHub user's top contributors across **all public repos** and returns them as a clean SVG with circular avatars — ready to embed anywhere.

---

## Usage

Embed in any GitHub README:

```md
![Top Contributors](https://your-app.vercel.app/api/contributors?username=YOUR_GITHUB_USERNAME)
```

---

## Query Parameters

| Parameter | Default | Allowed Values | Description |
|---|---|---|---|
| `username` | **required** | any GitHub username | The GitHub user whose contributors are shown |
| `limit` | `10` | `1` – `20` | How many top contributors to display |
| `size` | `64` | `24` – `128` | Diameter of each avatar circle in pixels |
| `hide_bots` | `true` | `true` / `false` | Whether to filter out GitHub bot accounts |

> **Note:** The repo owner (`username`) is always excluded from the results — no parameter needed.

---

## Examples

**Default — top 10 contributors, 64px circles:**
```md
![Top Contributors](https://your-app.vercel.app/api/contributors?username=torvalds)
```

**Show only top 5:**
```md
![Top Contributors](https://your-app.vercel.app/api/contributors?username=torvalds&limit=5)
```

**Larger avatars (80px):**
```md
![Top Contributors](https://your-app.vercel.app/api/contributors?username=torvalds&size=80)
```

**Include bots in results:**
```md
![Top Contributors](https://your-app.vercel.app/api/contributors?username=torvalds&hide_bots=false)
```

**All params combined:**
```md
![Top Contributors](https://your-app.vercel.app/api/contributors?username=torvalds&limit=8&size=72&hide_bots=false)
```

---

## How It Works

1. Fetches all public repos for `username` via the GitHub API
2. Fetches contributors for each repo in parallel
3. Aggregates contribution counts across all repos
4. Filters out the owner (always) and bots (by default)
5. Returns the top N as an SVG — avatars are embedded as base64 so GitHub's image proxy renders them correctly

---

## Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)

**Files needed (that's it):**
```
api/contributors.js   ← the API
vercel.json           ← routing config
package.json          ← declares ES module type
```

No npm install. No build step. Just push and deploy.

---

## Limits

- GitHub's unauthenticated API allows **60 requests/hour per IP**. For users with many repos this could be hit on the first cold request. Subsequent requests are cached on Vercel's edge for **1 hour**.
- Max `limit` is capped at **20** to keep response times reasonable.
- Max `size` is capped at **128px**.
