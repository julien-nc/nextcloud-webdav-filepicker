import { translations } from './translations.js'
import { getGettextBuilder } from '@nextcloud/l10n/gettext'
import { po } from 'gettext-parser'

const langConvertions = {
	'fr-FR': 'fr',
	'es-ES': 'es',
	'de-DE': 'de',
	'ja-JP': 'ja',
	'ru-RU': 'ru',
	'nl-NL': 'nl',
	'it-IT': 'it',
	'da-DK': 'da',
	'sv-SE': 'sv',
	'tr-TR': 'tr',
	'ko-KR': 'ko',
	'ca-ES': 'ca',
	'ro-RO': 'ro',
	'no-NO': 'nn',
	'cs-CZ': 'cs',
	'fi-FI': 'fi',
	'hu-HU': 'hu',
	'pl-PL': 'pl',
	'sk-SK': 'sk',
	'fa-IR': 'fa',
	'hi-IN': 'hi',
	'id-ID': 'id',
	'uk-UA': 'uk',
	'el-GR': 'el',
	'bg-BG': 'bg',
	'en-GB': 'en',
	'sl-SI': 'sl',
	'pt-PT': 'pt',
	'pt-BR': 'pt-br',
	'ar-SA': 'ar',
	'bn-BD': 'bn',
	'af-ZA': 'af',
	'he-IL': 'he',
	'mn-MN': 'mn',
	'ne-NP': 'ne',
	'sr-SP': 'sr',
	'ta-IN': 'ta',
	'te-IN': 'te',
	'th-TH': 'th',
	'vi-VN': 'vi',
	'zh-CN': 'zh-hans',
	'zh-TW': 'zh-hant',
	'sq-AL': 'sq',
}

let gt

export function setLanguage(lang = null) {
	if (lang === null) {
		lang = navigator.language
	}
	if (lang && lang.length > 2) {
		for (const orig in langConvertions) {
			lang = lang.replace(orig, langConvertions[orig])
		}
	}

	gt = (lang in translations)
		? getGettextBuilder()
			// .detectLocale()
			.setLanguage(lang)
			.addTranslation(lang, po.parse(translations[lang]))
			.build()
		: getGettextBuilder()
			.build()
}

setLanguage()

export const t = (appId, string, placeholders = null) => {
	return gt.gettext(string, placeholders)
}
export const n = (appId, singular, plural, number, placeholders = null) => {
	return gt.ngettext(singular, plural, number, placeholders)
}
