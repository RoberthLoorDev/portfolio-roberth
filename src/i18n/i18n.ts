/**
 * Client-side i18n manager.
 * - Detects browser language on first visit
 * - Stores preference in localStorage
 * - Swaps text via data-i18n / data-i18n-html / data-i18n-placeholder attributes
 */
import { translations, type Lang } from './translations'

const STORAGE_KEY = 'portfolio-lang'
const SUPPORTED_LANGS: Lang[] = ['en', 'es']
const DEFAULT_LANG: Lang = 'en'

/** Detect browser/OS language */
function detectBrowserLang(): Lang {
  const browserLang = navigator.language || (navigator as any).userLanguage || ''
  const short = browserLang.split('-')[0].toLowerCase()
  if (SUPPORTED_LANGS.includes(short as Lang)) {
    return short as Lang
  }
  return DEFAULT_LANG
}

/** Get current language from storage or detect */
export function getLang(): Lang {
  if (typeof window === 'undefined') return DEFAULT_LANG
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LANGS.includes(stored as Lang)) {
    return stored as Lang
  }
  const detected = detectBrowserLang()
  localStorage.setItem(STORAGE_KEY, detected)
  return detected
}

/** Set language and apply translations */
export function setLang(lang: Lang): void {
  localStorage.setItem(STORAGE_KEY, lang)
  applyTranslations(lang)
  updateSelector(lang)
  document.documentElement.setAttribute('lang', lang)
}

/** Resolve a dot-notation key like "header.greeting" from the translations object */
function resolve(obj: any, key: string): string | undefined {
  return key.split('.').reduce((acc, part) => acc?.[part], obj)
}

/** Apply all translations to the DOM */
export function applyTranslations(lang: Lang): void {
  const dict = translations[lang]

  // data-i18n → textContent replacement
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')!
    const value = resolve(dict, key)
    if (value) el.textContent = value
  })

  // data-i18n-html → innerHTML replacement (for elements with nested HTML tags)
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html')!
    const value = resolve(dict, key)
    if (value) el.innerHTML = value
  })

  // data-i18n-placeholder → placeholder attribute replacement
  document
    .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]')
    .forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder')!
      const value = resolve(dict, key)
      if (value) el.placeholder = value
    })

  // data-i18n-lang → show/hide pre-rendered content blocks by language
  document.querySelectorAll<HTMLElement>('[data-i18n-lang]').forEach((el) => {
    const elLang = el.getAttribute('data-i18n-lang')
    if (elLang === lang) {
      el.classList.remove('hidden')
    } else {
      el.classList.add('hidden')
    }
  })
}

/** Update the visual state of the language selector */
function updateSelector(lang: Lang): void {
  const btns = document.querySelectorAll<HTMLButtonElement>('[data-lang-btn]')
  btns.forEach((btn) => {
    const btnLang = btn.getAttribute('data-lang-btn')
    if (btnLang === lang) {
      btn.classList.add('lang-active')
    } else {
      btn.classList.remove('lang-active')
    }
  })
}

/** Initialize i18n on page load */
export function initI18n(): void {
  const lang = getLang()
  applyTranslations(lang)
  updateSelector(lang)
  document.documentElement.setAttribute('lang', lang)
}
