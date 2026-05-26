import { de } from "./de";
import { en } from "./en";

export type Locale = "de" | "en";
export type TranslationKey = keyof typeof de;

const LOCALE_KEY = "fastroute_locale";
const catalogs = { de, en } as const;

let current: Locale = loadStoredLocale();
const listeners = new Set<() => void>();

function loadStoredLocale(): Locale {
  try {
    if (typeof localStorage === "undefined") return "de";
    const v = localStorage.getItem(LOCALE_KEY);
    if (v === "en" || v === "de") return v;
  } catch {
    /* ignore */
  }
  return "de";
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  if (locale === current) return;
  current = locale;
  try {
    localStorage?.setItem(LOCALE_KEY, locale);
  } catch {
    /* ignore */
  }
  applyDocumentLocale();
  listeners.forEach((fn) => fn());
}

export function onLocaleChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const catalog = catalogs[current];
  let text: string = catalog[key] ?? catalogs.de[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

export function applyDocumentLocale(): void {
  if (typeof document !== "undefined") {
    document.documentElement.lang = current;
  }
}

export function timeLocale(): string {
  return current === "en" ? "en-GB" : "de-DE";
}

/** Update static DOM nodes by data-i18n attribute */
export function applyStaticI18n(root?: ParentNode): void {
  if (typeof document === "undefined") return;
  const scope = root ?? document;
  scope.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n as TranslationKey | undefined;
    if (!key) return;
    el.textContent = t(key);
  });
  scope.querySelectorAll<HTMLElement>("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder as TranslationKey | undefined;
    if (!key || !(el instanceof HTMLInputElement)) return;
    el.placeholder = t(key);
  });
  scope.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria as TranslationKey | undefined;
    if (!key) return;
    el.setAttribute("aria-label", t(key));
  });
}

applyDocumentLocale();
