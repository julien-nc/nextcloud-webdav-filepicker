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
