import { translations } from './translations'
import { getGettextBuilder } from '@nextcloud/l10n/dist/gettext'
import { po } from 'gettext-parser'

const lang = navigator.language
const gt = (lang in translations)
	? getGettextBuilder()
		// .detectLocale()
		.setLanguage(lang)
		.addTranslation(lang, po.parse(translations[lang]))
		.build()
	: getGettextBuilder()
		.build()

export const t = (appId, string, placeholders = null) => {
	return gt.gettext(string, placeholders)
}
export const n = (appId, singular, plural, number, placeholders = null) => {
	return gt.ngettext(singular, plural, number, placeholders)
}
