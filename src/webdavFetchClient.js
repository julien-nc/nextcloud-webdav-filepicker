import base64 from 'base-64'
import { basename } from '@nextcloud/paths'

export class WebDavFetchClient {

	constructor(options) {
		this.xmlParser = new DOMParser()
		this.ns = 'DAV:'

		this.url = options.url
		this.username = options.username
		this.password = options.password
		this.token = options.token
	}

	parseWebDavFileListXML(xmlString) {
		const dom = this.xmlParser.parseFromString(xmlString, 'application/xml')
		const responseList = dom.documentElement.getElementsByTagNameNS(this.ns, 'response')
		const elemList = []
		for (let i = 0; i < responseList.length; i++) {
			const elem = {}
			const e = responseList.item(i)
			elem.filename = decodeURIComponent(e.getElementsByTagNameNS(this.ns, 'href').item(0).innerHTML)
			if (e.getElementsByTagNameNS(this.ns, 'resourcetype').item(0).getElementsByTagNameNS(this.ns, 'collection').length > 0) {
				elem.type = 'directory'
				elem.basename = basename(elem.filename.replace(/\/$/, ''))
				elem.size = 0
			} else {
				elem.type = 'file'
				elem.basename = basename(elem.filename)
				elem.size = +e.getElementsByTagNameNS(this.ns, 'getcontentlength').item(0).innerHTML
				elem.mime = e.getElementsByTagNameNS(this.ns, 'getcontenttype').item(0).innerHTML
				elem.etag = e.getElementsByTagNameNS(this.ns, 'getetag').item(0).innerHTML
			}
			elem.lastmod = e.getElementsByTagNameNS(this.ns, 'getlastmodified').item(0).innerHTML
			// elem.Status = e.getElementsByTagNameNS(this.ns, 'status').item(0).innerHTML
			elemList.push(elem)
		}
		return elemList
	}

	getDirectoryContents(path) {
		const headers = new Headers()
		headers.append('Accept', 'text/plain')
		headers.append('Depth', '1')
		headers.append('Authorization', 'Basic ' + base64.encode(this.username + ':' + this.password))

		return new Promise((resolve, reject) => {
			fetch(this.url + path, {
				method: 'PROPFIND',
				credentials: 'omit',
				headers,
			}).then((response) => {
				// console.debug('then response')
				// console.debug(response)
				response.text().then(text => {
					// console.debug('RESPONSE')
					// console.debug(text)
					if (response.status < 400) {
						resolve(this.parseWebDavFileListXML(text))
					} else {
						reject(response, text)
					}
				})
			}).catch(err => {
				console.error(err)
				reject(err)
			})
		})
	}

	getQuota() {
		const headers = new Headers()
		headers.append('Accept', 'text/plain')
		headers.append('Depth', '0')
		headers.append('Authorization', 'Basic ' + base64.encode(this.username + ':' + this.password))

		return new Promise((resolve, reject) => {
			fetch(this.url, {
				method: 'PROPFIND',
				credentials: 'omit',
				headers,
			}).then((response) => {
				response.text().then(text => {
					if (response.status < 400) {
						resolve(this.parseWebDavQuotaXML(text))
					} else {
						reject(response, text)
					}
				})
			}).catch(err => {
				console.error(err)
				reject(err)
			})
		})
	}

	parseWebDavQuotaXML(xmlString) {
		const dom = this.xmlParser.parseFromString(xmlString, 'application/xml')
		const used = dom.documentElement.getElementsByTagNameNS(this.ns, 'quota-used-bytes')
		const available = dom.documentElement.getElementsByTagNameNS(this.ns, 'quota-available-bytes')
		const availableRawValue = available
			? parseInt(available.item(0).innerHTML)
			: undefined
		// negative -> unlimited
		const availableValue = availableRawValue
			? availableRawValue >= 0
				? availableRawValue
				: 'unlimited'
			: undefined
		return {
			used: used ? parseInt(used.item(0).innerHTML) : undefined,
			available: availableValue,
		}
	}

}
