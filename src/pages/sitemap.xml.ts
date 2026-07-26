import type { APIRoute } from "astro";

const siteUrl = "https://ibridge.info";

interface PagePair {
  zh: string;
  en: string;
  priority: string;
  changefreq: string;
}

const pagePairs: PagePair[] = [
  {
    zh: "/",
    en: "/en/",
    priority: "1.0",
    changefreq: "weekly",
  },
  {
    zh: "/about/",
    en: "/en/about/",
    priority: "0.8",
    changefreq: "monthly",
  },
  {
    zh: "/services/",
    en: "/en/services/",
    priority: "0.9",
    changefreq: "monthly",
  },
  {
    zh: "/programmes/",
    en: "/en/programmes/",
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    zh: "/research/",
    en: "/en/research/",
    priority: "0.8",
    changefreq: "monthly",
  },
  {
    zh: "/resources/",
    en: "/en/resources/",
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    zh: "/contact/",
    en: "/en/contact/",
    priority: "0.7",
    changefreq: "monthly",
  },
  {
    zh: "/privacy/",
    en: "/en/privacy/",
    priority: "0.4",
    changefreq: "yearly",
  },
  {
    zh: "/terms/",
    en: "/en/terms/",
    priority: "0.4",
    changefreq: "yearly",
  },
];

const createUrl = (path: string): string => {
  if (path === "/") {
    return `${siteUrl}/`;
  }

  return `${siteUrl}${path}`;
};

const escapeXml = (value: string): string => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
};

const createSitemapEntry = ({
  path,
  zhPath,
  enPath,
  priority,
  changefreq,
}: {
  path: string;
  zhPath: string;
  enPath: string;
  priority: string;
  changefreq: string;
}): string => {
  const pageUrl = escapeXml(createUrl(path));
  const zhUrl = escapeXml(createUrl(zhPath));
  const enUrl = escapeXml(createUrl(enPath));

  return `
  <url>
    <loc>${pageUrl}</loc>

    <xhtml:link
      rel="alternate"
      hreflang="zh-Hant"
      href="${zhUrl}"
    />

    <xhtml:link
      rel="alternate"
      hreflang="en"
      href="${enUrl}"
    />

    <xhtml:link
      rel="alternate"
      hreflang="x-default"
      href="${zhUrl}"
    />

    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
};

const sitemapEntries = pagePairs
  .flatMap((page) => [
    createSitemapEntry({
      path: page.zh,
      zhPath: page.zh,
      enPath: page.en,
      priority: page.priority,
      changefreq: page.changefreq,
    }),

    createSitemapEntry({
      path: page.en,
      zhPath: page.zh,
      enPath: page.en,
      priority: page.priority,
      changefreq: page.changefreq,
    }),
  ])
  .join("");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${sitemapEntries}
</urlset>
`;

export const GET: APIRoute = () => {
  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
};