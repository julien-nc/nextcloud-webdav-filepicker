import moment from 'moment'
import Gettext from 'node-gettext'
import { getLocale } from '@nextcloud/l10n'

const gt = new Gettext()

const locale = getLocale()
LOCALES.map(data => {
    gt.addTranslations(data.locale, 'messages', data.json)
})
gt.setLocale(locale)
moment.locale(locale)

moment.updateLocale(
    moment.locale(),
    {
        parentLocale: moment.locale(),
        relativeTime: Object.assign(
            // @ts-ignore
            moment.localeData(moment.locale())._relativeTime,
            {
                s: gt.gettext('seconds'),
            }
        )
    })

export default moment
