import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const token = process.env.GITHUB_TOKEN;
const username = process.env.PROFILE_USERNAME || "TheStreamCode";

if (!token) {
  throw new Error("GITHUB_TOKEN is required to generate profile statistics.");
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(repositoryRoot, "profile");
const graphQlEndpoint = "https://api.github.com/graphql";

async function graphQl(query, variables) {
  const response = await fetch(graphQlEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": `${username}-profile-stats`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed with HTTP ${response.status}.`);
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    const messages = payload.errors.map(({ message }) => message).join("; ");
    throw new Error(`GitHub GraphQL request failed: ${messages}`);
  }

  return payload.data;
}

const profileData = await graphQl(
  `
    query ProfileStats($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionYears
        }
        repositories(
          first: 100
          privacy: PUBLIC
          isFork: false
          ownerAffiliations: OWNER
          orderBy: { field: UPDATED_AT, direction: DESC }
        ) {
          totalCount
          nodes {
            isArchived
            languages(first: 20, orderBy: { field: SIZE, direction: DESC }) {
              edges {
                size
                node {
                  color
                  name
                }
              }
            }
          }
        }
      }
    }
  `,
  { login: username },
);

if (!profileData.user) {
  throw new Error(`GitHub user "${username}" was not found.`);
}

const currentDate = new Date();
const currentYear = currentDate.getUTCFullYear();
const contributionYears = profileData.user.contributionsCollection.contributionYears;

const contributionCollections = await Promise.all(
  contributionYears.map((year) => {
    const from = `${year}-01-01T00:00:00Z`;
    const to =
      year === currentYear
        ? currentDate.toISOString()
        : `${year}-12-31T23:59:59Z`;

    return graphQl(
      `
        query ContributionsByYear(
          $login: String!
          $from: DateTime!
          $to: DateTime!
        ) {
          user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
              contributionCalendar {
                totalContributions
              }
              totalCommitContributions
              totalPullRequestContributions
            }
          }
        }
      `,
      { login: username, from, to },
    );
  }),
);

const activity = contributionCollections.reduce(
  (totals, result) => {
    const collection = result.user.contributionsCollection;
    totals.contributions += collection.contributionCalendar.totalContributions;
    totals.commits += collection.totalCommitContributions;
    totals.pullRequests += collection.totalPullRequestContributions;
    return totals;
  },
  {
    contributions: 0,
    commits: 0,
    pullRequests: 0,
    repositories: profileData.user.repositories.totalCount,
  },
);

const languageTotals = new Map();

for (const repository of profileData.user.repositories.nodes) {
  if (repository.isArchived) {
    continue;
  }

  for (const edge of repository.languages.edges) {
    const existing = languageTotals.get(edge.node.name) || {
      bytes: 0,
      color: edge.node.color || "#8B949E",
      repositories: 0,
    };
    existing.bytes += edge.size;
    existing.repositories += 1;
    languageTotals.set(edge.node.name, existing);
  }
}

const sortedLanguages = [...languageTotals.entries()]
  .map(([name, data]) => ({ name, ...data }))
  .sort(
    (left, right) =>
      right.repositories - left.repositories || right.bytes - left.bytes,
  );

if (sortedLanguages.length === 0) {
  throw new Error("No public repository language data was returned by GitHub.");
}

const displayedLanguages = sortedLanguages.slice(0, 8);

const firstContributionYear = Math.min(...contributionYears);
const generatedDate = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
}).format(currentDate);

const themes = {
  light: {
    background: "#F6F8FA",
    border: "#D0D7DE",
    heading: "#1F2328",
    muted: "#59636E",
    primary: "#2563EB",
    secondary: "#0EA5E9",
    success: "#1A7F37",
    divider: "#D8DEE4",
  },
  dark: {
    background: "#0D1117",
    border: "#30363D",
    heading: "#F0F6FC",
    muted: "#9198A1",
    primary: "#60A5FA",
    secondary: "#22D3EE",
    success: "#3FB950",
    divider: "#30363D",
  },
};

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function cleanSvg(svg) {
  return svg.replace(/[ \t]+$/gm, "");
}

function brandMark(theme) {
  return `
    <g aria-hidden="true" transform="translate(32 27)">
      <rect width="16" height="12" rx="3" fill="${theme.primary}" />
      <rect x="19" width="10" height="12" rx="3" fill="${theme.secondary}" />
      <rect y="15" width="10" height="8" rx="3" fill="${theme.secondary}" />
      <rect x="13" y="15" width="16" height="8" rx="3" fill="${theme.primary}" />
    </g>`;
}

function activitySvg(themeName) {
  const theme = themes[themeName];
  const metrics = [
    {
      label: `CONTRIBUTIONS SINCE ${firstContributionYear}`,
      value: activity.contributions,
    },
    { label: "COMMIT CONTRIBUTIONS", value: activity.commits },
    { label: "PULL REQUESTS", value: activity.pullRequests },
    { label: "ORIGINAL PUBLIC REPOS", value: activity.repositories },
  ];

  const metricMarkup = metrics
    .map((metric, index) => {
      const x = 40 + index * 210;
      const divider =
        index === 0
          ? ""
          : `<line x1="${x - 20}" y1="104" x2="${x - 20}" y2="185" stroke="${theme.divider}" />`;

      return `
        ${divider}
        <text x="${x}" y="142" class="metric">${formatNumber(metric.value)}</text>
        <text x="${x}" y="170" class="label">${escapeXml(metric.label)}</text>`;
    })
    .join("");

  return `<svg
    xmlns="http://www.w3.org/2000/svg"
    width="880"
    height="230"
    viewBox="0 0 880 230"
    role="img"
    aria-labelledby="activity-title activity-description"
  >
    <title id="activity-title">${escapeXml(username)} GitHub activity</title>
    <desc id="activity-description">Automatically updated contribution, commit, pull request, and public repository statistics.</desc>
    <defs>
      <linearGradient id="activity-accent" x1="0" x2="1">
        <stop stop-color="${theme.primary}" />
        <stop offset="1" stop-color="${theme.secondary}" />
      </linearGradient>
    </defs>
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .heading { fill: ${theme.heading}; font-size: 22px; font-weight: 700; }
      .muted { fill: ${theme.muted}; font-size: 13px; }
      .metric { fill: ${theme.heading}; font-size: 30px; font-weight: 700; }
      .label { fill: ${theme.muted}; font-size: 10px; font-weight: 600; letter-spacing: .6px; }
    </style>
    <rect x=".5" y=".5" width="879" height="229" rx="16" fill="${theme.background}" stroke="${theme.border}" />
    <rect x="1" y="1" width="878" height="4" rx="2" fill="url(#activity-accent)" />
    ${brandMark(theme)}
    <text x="75" y="47" class="heading">GitHub activity</text>
    <text x="75" y="69" class="muted">Verified through the GitHub GraphQL API</text>
    ${metricMarkup}
    <circle cx="40" cy="207" r="4" fill="${theme.success}" />
    <text x="52" y="211" class="muted">Updated automatically · ${escapeXml(generatedDate)}</text>
  </svg>
`;
}

function languagesSvg(themeName) {
  const theme = themes[themeName];
  const maxRepositoryCount = displayedLanguages[0].repositories;

  const legend = displayedLanguages
    .map((language, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      const x = 40 + column * 205;
      const y = 115 + row * 61;
      const usageWidth = (language.repositories / maxRepositoryCount) * 160;
      const repositoryLabel =
        language.repositories === 1 ? "repository" : "repositories";

      return `
        <circle cx="${x + 5}" cy="${y - 4}" r="5" fill="${language.color}" />
        <text x="${x + 18}" y="${y}" class="language">${escapeXml(language.name)}</text>
        <text x="${x + 18}" y="${y + 18}" class="count">${language.repositories} ${repositoryLabel}</text>
        <rect x="${x}" y="${y + 27}" width="160" height="4" rx="2" fill="${theme.divider}" />
        <rect x="${x}" y="${y + 27}" width="${usageWidth.toFixed(2)}" height="4" rx="2" fill="${language.color}" />`;
    })
    .join("");

  return `<svg
    xmlns="http://www.w3.org/2000/svg"
    width="880"
    height="230"
    viewBox="0 0 880 230"
    role="img"
    aria-labelledby="languages-title languages-description"
  >
    <title id="languages-title">${escapeXml(username)} repository languages</title>
    <desc id="languages-description">Languages ranked by their presence across original, active, public repositories owned by ${escapeXml(username)}.</desc>
    <defs>
      <linearGradient id="languages-accent" x1="0" x2="1">
        <stop stop-color="${theme.primary}" />
        <stop offset="1" stop-color="${theme.secondary}" />
      </linearGradient>
    </defs>
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .heading { fill: ${theme.heading}; font-size: 22px; font-weight: 700; }
      .muted { fill: ${theme.muted}; font-size: 13px; }
      .language { fill: ${theme.heading}; font-size: 13px; font-weight: 600; }
      .count { fill: ${theme.muted}; font-size: 12px; }
    </style>
    <rect x=".5" y=".5" width="879" height="229" rx="16" fill="${theme.background}" stroke="${theme.border}" />
    <rect x="1" y="1" width="878" height="4" rx="2" fill="url(#languages-accent)" />
    ${brandMark(theme)}
    <text x="75" y="47" class="heading">Repository languages</text>
    <text x="75" y="69" class="muted">Presence across ${activity.repositories} original public repositories</text>
    <text x="840" y="69" text-anchor="end" class="muted">Updated ${escapeXml(generatedDate)}</text>
    ${legend}
  </svg>
`;
}

await mkdir(outputDirectory, { recursive: true });

await Promise.all([
  writeFile(
    resolve(outputDirectory, "activity-light.svg"),
    cleanSvg(activitySvg("light")),
  ),
  writeFile(
    resolve(outputDirectory, "activity-dark.svg"),
    cleanSvg(activitySvg("dark")),
  ),
  writeFile(
    resolve(outputDirectory, "languages-light.svg"),
    cleanSvg(languagesSvg("light")),
  ),
  writeFile(
    resolve(outputDirectory, "languages-dark.svg"),
    cleanSvg(languagesSvg("dark")),
  ),
]);

console.log(
  `Generated profile statistics for ${username}: ${formatNumber(activity.contributions)} contributions, ${formatNumber(activity.commits)} commits, ${formatNumber(activity.pullRequests)} pull requests, and ${formatNumber(activity.repositories)} original public repositories.`,
);
