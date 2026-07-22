import { useEffect } from 'react';

// Client-side per-route SEO for the SPA: sets <title>, meta description,
// canonical + Open-Graph tags and injects JSON-LD structured data. On route
// change the previous values are restored, so pages without useSeo (Home)
// keep the defaults from index.html.
const SITE = 'https://www.sehandwerk.de';

function upsertMeta(key: string, keyName: 'name' | 'property', content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${keyName}="${key}"]`);
  let created = false;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(keyName, key);
    document.head.appendChild(el);
    created = true;
  }
  const prev = el.getAttribute('content');
  el.setAttribute('content', content);
  return () => {
    if (created) el.remove();
    else if (prev !== null) el.setAttribute('content', prev);
  };
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  let created = false;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
    created = true;
  }
  const prev = el.getAttribute('href');
  el.setAttribute('href', href);
  return () => {
    if (created) el.remove();
    else if (prev !== null) el.setAttribute('href', prev);
  };
}

export interface SeoInput {
  title: string;
  description: string;
  path: string;
  jsonLd?: unknown;
}

export function useSeo({ title, description, path, jsonLd }: SeoInput) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const url = SITE + path;
    const prevTitle = document.title;
    document.title = title;

    const restore = [
      upsertMeta('description', 'name', description),
      upsertMeta('og:title', 'property', title),
      upsertMeta('og:description', 'property', description),
      upsertMeta('og:url', 'property', url),
      upsertLink('canonical', url),
    ];

    let script: HTMLScriptElement | null = null;
    if (ld) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = ld;
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      restore.forEach((r) => r());
      script?.remove();
    };
  }, [title, description, path, ld]);
}

export const SEO_SITE = SITE;
