export default async function handler(req, res) {
  const {
    username,
    limit = 10,
    size = 64,
    hide_bots = 'true',
  } = req.query;

  if (!username) {
    return res.status(400).send('Missing ?username= parameter');
  }

  const maxContributors = Math.min(parseInt(limit, 10) || 10, 20);
  const avatarSize = Math.min(Math.max(parseInt(size, 10) || 64, 24), 128);
  const filterBots = hide_bots !== 'false';
  const headers = { 'User-Agent': 'github-contributors-svg' };

  try {
    // 1. Fetch all public repos (up to 100)
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&type=public`,
      { headers }
    );
    if (!reposRes.ok) throw new Error(`GitHub API error: ${reposRes.status}`);
    const repos = await reposRes.json();

    // 2. Fetch contributors for each repo in parallel
    const contributorMaps = await Promise.all(
      repos.map(async (repo) => {
        try {
          const r = await fetch(
            `https://api.github.com/repos/${username}/${repo.name}/contributors?per_page=100&anon=false`,
            { headers }
          );
          if (!r.ok) return [];
          return await r.json();
        } catch {
          return [];
        }
      })
    );

    // 3. Aggregate contribution counts
    const totals = {};
    for (const list of contributorMaps) {
      if (!Array.isArray(list)) continue;
      for (const c of list) {
        if (!c.login) continue; // skip anonymous contributors
        // Self is always excluded
        if (c.login.toLowerCase() === username.toLowerCase()) continue;
        // Bots: filtered by default, pass hide_bots=false to include them
        if (filterBots && c.type === 'Bot') continue;
        totals[c.login] = (totals[c.login] || 0) + c.contributions;
        if (!totals[c.login + '__avatar']) {
          totals[c.login + '__avatar'] = c.avatar_url;
        }
      }
    }

    // 4. Sort and pick top N
    const top = Object.entries(totals)
      .filter(([key]) => !key.includes('__avatar'))
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxContributors)
      .map(([login, contributions]) => ({
        login,
        contributions,
        avatar: totals[login + '__avatar'],
      }));

    if (top.length === 0) {
      return res
        .status(200)
        .setHeader('Content-Type', 'image/svg+xml')
        .setHeader('Cache-Control', 's-maxage=3600')
        .send(emptySvg());
    }

    // 5. Fetch avatar images and convert to base64 data URIs
    const avatarData = await Promise.all(
      top.map(async (c) => {
        try {
          const r = await fetch(`${c.avatar}&s=${avatarSize * 2}`); // 2x for retina
          const buf = await r.arrayBuffer();
          const b64 = Buffer.from(buf).toString('base64');
          const mime = r.headers.get('content-type') || 'image/jpeg';
          return { ...c, dataUri: `data:${mime};base64,${b64}` };
        } catch {
          return { ...c, dataUri: null };
        }
      })
    );

    // 6. Build SVG
    const gap = Math.round(avatarSize * 0.18); // gap scales with size
    const pad = Math.round(avatarSize * 0.12); // outer padding scales too
    const totalW = pad + top.length * (avatarSize + gap) - gap + pad;
    const totalH = pad + avatarSize + pad;

    const defs = avatarData
      .map(
        (c, i) => `
      <clipPath id="clip${i}">
        <circle cx="${pad + i * (avatarSize + gap) + avatarSize / 2}" cy="${pad + avatarSize / 2}" r="${avatarSize / 2}" />
      </clipPath>`
      )
      .join('');

    const images = avatarData
      .map((c, i) => {
        const cx = pad + i * (avatarSize + gap);
        const cy = pad;
        const href = c.dataUri || `https://avatars.githubusercontent.com/${c.login}?s=${avatarSize * 2}`;
        return `
      <a href="https://github.com/${c.login}" target="_blank" rel="noopener">
        <image
          x="${cx}" y="${cy}"
          width="${avatarSize}" height="${avatarSize}"
          href="${href}"
          clip-path="url(#clip${i})"
        />
        <circle
          cx="${cx + avatarSize / 2}" cy="${cy + avatarSize / 2}" r="${avatarSize / 2 - 1}"
          fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"
        />
        <title>${c.login} (${c.contributions} contributions)</title>
      </a>`;
      })
      .join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
  <defs>${defs}
  </defs>
  ${images}
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(svg);
  } catch (err) {
    console.error(err);
    return res.status(500).send(`Error: ${err.message}`);
  }
}

function emptySvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="40">
    <text x="10" y="28" font-family="sans-serif" font-size="14" fill="#888">No contributors found.</text>
  </svg>`;
}
