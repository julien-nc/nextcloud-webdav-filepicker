let mytimer = 0
export function delay(callback, ms) {
	return function() {
		const context = this
		const args = arguments
		clearTimeout(mytimer)
		mytimer = setTimeout(function() {
			callback.apply(context, args)
		}, ms || 0)
	}
}

export function addCustomEventListener(selector, event, handler) {
	const rootElement = document.querySelector('body')
	rootElement.addEventListener(event, function(evt) {
		let targetElement = evt.target
		while (targetElement != null) {
			if (targetElement.matches(selector)) {
				handler(evt, targetElement)
				return
			}
			targetElement = targetElement.parentElement
		}
	},
	true)
}

export function humanFileSize(bytes, approx = false, si = false, dp = 1) {
	const thresh = si ? 1000 : 1024

	if (Math.abs(bytes) < thresh) {
		return bytes + ' B'
	}

	const units = si
		? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
		: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
	let u = -1
	const r = 10 ** dp

	do {
		bytes /= thresh
		++u
	} while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)

	if (approx) {
		return Math.floor(bytes) + ' ' + units[u]
	} else {
		return bytes.toFixed(dp) + ' ' + units[u]
	}
}

export function colorOpacity(hexColor, opacity) {
	// validate hex string
	let hex = String(hexColor).replace(/[^0-9a-f]/gi, '')
	if (hex.length < 6) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
	}

	const dec = {
		r: parseInt(hex.substr(0, 2), 16),
		g: parseInt(hex.substr(2, 2), 16),
		b: parseInt(hex.substr(4, 2), 16),
	}
	return `rgba(${dec.r},${dec.g},${dec.b},${opacity})`
}

export function colorLuminance(hexColor, lumModifier) {
	// validate hex string
	let hex = String(hexColor).replace(/[^0-9a-f]/gi, '')
	if (hex.length < 6) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
	}
	const lum = lumModifier || 0

	// convert to decimal and change luminosity
	let rgb = '#'
	for (let i = 0; i < 3; i++) {
		let c = parseInt(hex.substr(i * 2, 2), 16)
		c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16)
		rgb += ('00' + c).substr(c.length)
	}

	return rgb
}

export function getElemTypeClass(elem) {
	if (elem.type === 'directory') {
		return { 'icon-folder': true }
	} else {
		const mime = elem.mime
		if (mime.match(/^video\//)) {
			return { 'icon-video': true }
		} else if (mime === 'text/calendar') {
			return { 'icon-calendar': true }
		} else if (mime === 'text/csv' || mime.match(/^application\/.*opendocument\.spreadsheet$/) || mime.match(/^application\/.*office.*sheet$/)) {
			return { 'icon-spreadsheet': true }
		} else if (mime.match(/^text\//)) {
			return { 'icon-text': true }
		} else if (mime.match(/^application\/pdf$/)) {
			return { 'icon-pdf': true }
		} else if (mime.match(/^application\/gpx/)) {
			return { 'icon-location': true }
		} else if (mime.match(/^image\//)) {
			return { 'icon-picture': true }
		} else if (mime.match(/^audio\//)) {
			return { 'icon-audio': true }
		} else if (mime.match(/^application\/.*opendocument\.text$/) || mime.match(/^application\/.*word.*document$/)) {
			return { 'icon-office-document': true }
		} else if (mime.match(/^application\/.*opendocument\.presentation$/) || mime.match(/^application\/.*office.*presentation$/)) {
			return { 'icon-office-presentation': true }
		}
		return { 'icon-file': true }
	}
}
