import base64 from 'base-64'
import { basename } from '@nextcloud/paths'

export class WebDavFetchClient {

	constructor(options) {
		this.xmlParser = new DOMParser()
		this.ns = 'DAV:'

		this.url = options.url
		const parsedUrl = new URL(this.url)
		this.basePath = parsedUrl.pathname

		this.username = options.username
		this.password = options.password
		this.token = options.token
	}

	parseWebDavFileListXML(xmlString, path) {
		const dom = this.xmlParser.parseFromString(xmlString, 'application/xml')
		const responseList = dom.documentElement.getElementsByTagNameNS(this.ns, 'response')
		const elemList = []
		for (let i = 0; i < responseList.length; i++) {
			const elem = {}
			const e = responseList.item(i)
			elem.filename = decodeURIComponent(e.getElementsByTagNameNS(this.ns, 'href').item(0).innerHTML)
			elem.filename = elem.filename.replace(this.basePath, '').replace(/\/$/, '')
			if (e.getElementsByTagNameNS(this.ns, 'resourcetype').item(0).getElementsByTagNameNS(this.ns, 'collection').length > 0) {
				// skip current directory
				if (elem.filename === path.replace(/\/$/, '')) {
					continue
				}
				elem.type = 'directory'
				elem.basename = basename(elem.filename)
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
				response.text().then(text => {
					if (response.status < 400) {
						resolve(this.parseWebDavFileListXML(text, path))
					} else {
						reject(new Error({ response }), text)
					}
				})
			}).catch(err => {
				console.error(err)
				reject(err)
			})
		})
	}

	createDirectory(path) {
		const headers = new Headers()
		headers.append('Authorization', 'Basic ' + base64.encode(this.username + ':' + this.password))

		return new Promise((resolve, reject) => {
			fetch(this.url + path, {
				method: 'MKCOL',
				credentials: 'omit',
				headers,
			}).then((response) => {
				response.text().then(text => {
					if (response.status < 400) {
						resolve()
					} else {
						reject(new Error({ response }))
					}
				})
			}).catch(err => {
				console.error(err)
				reject(err)
			})
		})
	}

	getFileContents(path) {
		const headers = new Headers()
		headers.append('Authorization', 'Basic ' + base64.encode(this.username + ':' + this.password))

		return new Promise((resolve, reject) => {
			fetch(this.url + path, {
				method: 'GET',
				credentials: 'omit',
				headers,
			}).then((response) => {
				if (response.status < 400) {
					resolve(response.arrayBuffer())
				} else {
					reject(new Error({ response }))
				}
			}).catch(err => {
				console.error(err)
				reject(err)
			})
		})
	}

	putFileContents(targetPath, file, options) {
		const headers = new Headers()
		headers.append('Authorization', 'Basic ' + base64.encode(this.username + ':' + this.password))

		return new Promise((resolve, reject) => {
			fetch(this.url + targetPath, {
				method: 'PUT',
				credentials: 'omit',
				headers,
				body: file,
			}).then((response) => {
				if (response.status < 400) {
					resolve()
				} else {
					reject(new Error({ response }))
				}
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

	getFileDownloadLink(path) {
		return this.url.replace(/^(https?:\/\/)([^/]+)\/.*/, '$1' + this.username + ':' + this.password + '@$2')
			+ path
	}

	getFileUploadLink(uploadPath) {
		return this.url.replace(/^(https?:\/\/)/, '$1' + this.username + ':' + this.password + '@')
			+ uploadPath + '?Content-Type=application/octet-stream'
	}

}
