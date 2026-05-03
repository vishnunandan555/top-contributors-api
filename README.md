# 🚀 Top Contributors API [ OTG Edition ]

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/vishnunandan555/top-contributors-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A zero-dependency, single-file **Public API** that fetches a GitHub user's top contributors across **all public repositories** and returns them as a beautiful, embeddable SVG with circular avatars.

---

## ⚡ What is the OTG Edition?

The **"On-The-Go" (OTG)** version is designed for maximum convenience. Unlike the [standard version](https://github.com/vishnunandan555/top-contributors-api/), it requires **zero configuration** and **no local hosting**. 

- ✅ **No Setup Required:** Just use the URL.
- ✅ **Dynamic:** Fetches real-time data across all user repositories.
- ✅ **Public API:** Hosted and maintained for the community.
- ✅ **One-Click Embed:** Drop the URL into your README and you're done.

> [!NOTE]
> Looking for the non-OTG version? [Find it here](https://github.com/vishnunandan555/top-contributors-api/). It's better for high-traffic repositories as it uses a custom caching layer to avoid rate limits.

---

## 🛠️ Interactive Builder

Don't want to type out the parameters? Use our interactive UI to generate your snippet:
👉 **[top-contributors-otg.vercel.app](https://top-contributors-otg.vercel.app)**

---

## 📝 Usage

Copy the line below, replace `YOUR_GITHUB_USERNAME`, and drop it into any Markdown file:

```md
![Top Contributors](https://top-contributors-otg.vercel.app/api/contributors?username=YOUR_GITHUB_USERNAME)
```

### Query Parameters

Customize the output by appending these parameters:

| Parameter | Default | Range | Description |
|---|---|---|---|
| `username` | **Required** | string | The GitHub user whose contributors you want to display. |
| `limit` | `10` | `1 – 20` | Maximum number of contributors to show. |
| `size` | `64` | `24 – 128` | Diameter of each avatar circle in pixels. |
| `hide_bots` | `true` | `true/false` | Whether to filter out bot accounts (e.g., dependabot). |

---

## 🎨 Examples

### Default (Top 10, 64px)
```md
![Top Contributors](https://top-contributors-otg.vercel.app/api/contributors?username=torvalds)
```

### Custom Limit & Large Avatars (Top 5, 80px)
```md
![Top Contributors](https://top-contributors-otg.vercel.app/api/contributors?username=torvalds&limit=5&size=80)
```

### Include Bots
```md
![Top Contributors](https://top-contributors-otg.vercel.app/api/contributors?username=torvalds&hide_bots=false)
```

---

## 🧠 How It Works

1. **Parallel Fetching:** Hits the GitHub API to list all public repos for a user.
2. **Aggregation:** Fetches contributors for every repository simultaneously and sums up their contribution counts.
3. **Filtering:** Automatically excludes the repository owner and (optionally) bots.
4. **SVG Generation:** Constructs a lightweight SVG.
5. **Base64 Embedding:** Avatar images are converted to base64 data URIs inside the SVG. This ensures they render correctly even through GitHub's `camo` image proxy.

---

## ⚠️ Limitations

- **Rate Limits:** As a public API, it shares a global rate limit pool. For very large users or heavy traffic, the API might return a 500 or 403 error until the limit resets.
- **Caching:** Responses are cached on Vercel's edge for **1 hour** to ensure snappy performance.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/vishnunandan555">Vishnu Nandan</a>
</p>
