import base64 from 'base-64'
import { basename } from '@nextcloud/paths'

const propertyRequestBody = `<?xml version="1.0"?>
<d:propfind  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns">
  <d:prop>
        <d:getlastmodified />
        <d:getetag />
        <d:getcontenttype />
        <d:resourcetype />
        <oc:fileid />
        <oc:permissions />
        <oc:size />
        <d:getcontentlength />
        <nc:has-preview />
        <oc:favorite />
        <oc:comments-unread />
        <oc:owner-display-name />
        <oc:share-types />
  </d:prop>
</d:propfind>`

const propertyRequestBodyWithQuota = `<?xml version="1.0"?>
<d:propfind  xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns">
  <d:prop>
        <d:quota-available-bytes />
        <d:quota-used-bytes />
        <d:getlastmodified />
        <d:getetag />
        <d:getcontenttype />
        <d:resourcetype />
        <oc:fileid />
        <oc:permissions />
        <oc:size />
        <d:getcontentlength />
        <nc:has-preview />
        <oc:favorite />
        <oc:comments-unread />
        <oc:owner-display-name />
        <oc:share-types />
  </d:prop>
</d:propfind>`

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export class WebDavFetchClient {

	constructor(options) {
		this.xmlParser = new DOMParser()
		this.ns = 'DAV:'

		this.url = options.url
		const parsedUrl = new URL(this.url)
		this.basePath = parsedUrl.pathname
		// this is used to compute the relative path (without relying on the base path)
		this.userId = options.userId
		this.pathRegex = new RegExp('.*' + escapeRegExp('/remote.php/dav/files/' + this.userId), 'g')

		this.username = options.username
		this.password = options.password
		this.token = options.token
		if (this.username && this.password) {
			this.authHeader = 'Basic ' + base64.encode(this.username + ':' + this.password)
		} else if (this.token) {
			this.authHeader = this.token.token_type + ' ' + this.token.access_token
		}
		this.credentialsMode = options.useCookies
			? 'include'
			: 'omit'
	}

	appendAuthHeader(headers) {
		if (this.authHeader) {
			headers.append('Authorization', this.authHeader)
		}
	}

	getAuthHeader() {
		if (this.authHeader) {
			return { Authorization: this.authHeader }
		}
	}

	parseWebDavFileListXML(xmlString, path, getQuota = false) {
		const dom = this.xmlParser.parseFromString(xmlString, 'application/xml')
		const responseList = dom.documentElement.getElementsByTagNameNS(this.ns, 'response')
		const result = {
			nodes: [],
		}
		for (let i = 0; i < responseList.length; i++) {
			const node = {}
			const e = responseList.item(i)
			node.filename = decodeURIComponent(e.getElementsByTagNameNS(this.ns, 'href').item(0).innerHTML)
			node.filename = node.filename.replace(this.pathRegex, '').replace(/\/$/, '')
			node.fileid = parseInt(e.getElementsByTagName('oc:fileid')?.item(0)?.innerHTML ?? 0)
			if (e.getElementsByTagNameNS(this.ns, 'resourcetype').item(0).getElementsByTagNameNS(this.ns, 'collection').length > 0) {
				// skip current directory
				if (node.filename === path.replace(/\/$/, '')) {
					continue
				}
				node.type = 'directory'
			} else {
				node.type = 'file'
				node.mime = e.getElementsByTagNameNS(this.ns, 'getcontenttype').item(0).innerHTML
				node.etag = e.getElementsByTagNameNS(this.ns, 'getetag').item(0).innerHTML
			}
			node.size = +e.getElementsByTagNameNS(this.ns, 'getcontentlength')?.item(0)?.innerHTML
			if (!node.size) {
				node.size = +e.getElementsByTagName('oc:size')?.item(0)?.innerHTML
			}
			node.haspreview = e.getElementsByTagName('nc:has-preview')?.item(0)?.innerHTML === 'true'
			node.basename = basename(node.filename)
			node.lastmod = e.getElementsByTagNameNS(this.ns, 'getlastmodified').item(0).innerHTML
			// elem.Status = e.getElementsByTagNameNS(this.ns, 'status').item(0).innerHTML
			result.nodes.push(node)
		}
		if (getQuota) {
			result.quota = this.getQuotaFromParsedXml(dom)
		}
		return result
	}

	getDirectoryContents(path, getQuota = false) {
		const headers = new Headers()
		headers.append('Accept', 'text/plain')
		headers.append('Depth', '1')
		headers.append('Content-Type', 'application/xml')
		this.appendAuthHeader(headers)

		return new Promise((resolve, reject) => {
			fetch(this.url + path, {
				method: 'PROPFIND',
				credentials: this.credentialsMode,
				headers,
				body: getQuota ? propertyRequestBodyWithQuota : propertyRequestBody,
			}).then((response) => {
				response.text().then(text => {
					if (response.status < 400) {
						resolve(this.parseWebDavFileListXML(text, path, getQuota))
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
		this.appendAuthHeader(headers)

		return new Promise((resolve, reject) => {
			fetch(this.url + path, {
				method: 'MKCOL',
				credentials: this.credentialsMode,
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
		this.appendAuthHeader(headers)

		return fetch(this.url + path, {
			method: 'GET',
			credentials: this.credentialsMode,
			headers,
		})
	}

	putFileContents(targetPath, file, options) {
		const headers = new Headers()
		this.appendAuthHeader(headers)

		return new Promise((resolve, reject) => {
			fetch(this.url + targetPath, {
				method: 'PUT',
				credentials: this.credentialsMode,
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
		this.appendAuthHeader(headers)

		return new Promise((resolve, reject) => {
			fetch(this.url, {
				method: 'PROPFIND',
				credentials: this.credentialsMode,
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
		return this.getQuotaFromParsedXml(dom)
	}

	getQuotaFromParsedXml(dom) {
		try {
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
		} catch (e) {
			console.error('Failed to parse quota', e)
		}
		return null
	}

	getFileDownloadLink(path) {
		if (!this.password) {
			throw new Error('Impossible to generate download link when login or password is missing.')
		}
		return this.url.replace(/^(https?:\/\/)([^/]+)\/.*/, '$1' + this.username + ':' + this.password + '@$2')
			+ path
	}

	getFileUploadLink(uploadPath) {
		if (!this.password) {
			throw new Error('Impossible to generate upload link when login or password is missing.')
		}
		return this.url.replace(/^(https?:\/\/)/, '$1' + this.username + ':' + this.password + '@')
			+ uploadPath + '?Content-Type=application/octet-stream'
	}

}
