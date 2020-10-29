import Toastify from 'toastify-js'

class ToastType {
	static readonly ERROR = 'toast-error';
	static readonly WARNING = 'toast-warning';
	static readonly INFO = 'toast-info';
	static readonly SUCCESS = 'toast-success';
	static readonly PERMANENT = 'toast-error';
}

export interface ToastOptions {
	/**
	 * Defines the timeout after which the toast is closed. Set to 0 to have a persistent toast.
	 */
	timeout?: number

	/**
	 * Set to true to allow HTML content inside of the toast text
	 * @default false
	 */
	isHTML?: Boolean

	/**
	 * Set a type of {ToastType} to style the modal
	 */
	type?: ToastType

	/**
	 * Provide a function that is called after the toast is removed
	 */
	onRemove?: Function

	/**
	 * Provide a function that is called when the toast is clicked
	 */
	onClick?: Function

	/**
	 * Make the toast closable
	 */
	close?: Boolean

	/**
	 * Specify the element to attach the toast element to (for testing)
	 */
	selector?: string
}

/**
 * Show a toast message
 *
 * @param text Message to be shown in the toast, any HTML is removed by default
 * @param options
 */
export function showMessage(text: string, options?: ToastOptions): Toast {
	options = Object.assign({
		timeout: 7,
		isHTML: false,
		type: undefined,
		// An undefined selector defaults to the body element
		selector: undefined,
		onRemove: () => { },
		onClick: () => { },
		close: true
	}, options)
	if (!options.isHTML) {
		// fime mae sure that text is extracted
		const element = document.createElement('div')
		element.innerHTML = text
		text = element.innerText
	}
	let classes = options.type ?? ''

	const toast = Toastify({
		text: text,
		duration: (options.timeout === null || options.timeout === undefined) ? null : options.timeout * 1000,
		callback: options.onRemove,
		onClick: options.onClick,
		close: options.close,
		gravity: 'top',
		selector: options.selector,
		position: 'right',
		backgroundColor: '',
		className: 'toast ' + classes,
	})
	toast.showToast()
	return toast
}

/**
 * Show a toast message with error styling
 *
 * @param text Message to be shown in the toast, any HTML is removed by default
 * @param options
 */
export function showError(text: string, options?: ToastOptions): Toast {
	return showMessage(text, { ...options, type: ToastType.ERROR })
}

/**
 * Show a toast message with warning styling
 *
 * @param text Message to be shown in the toast, any HTML is removed by default
 * @param options
 */
export function showWarning(text: string, options?: ToastOptions): Toast {
	return showMessage(text, { ...options, type: ToastType.WARNING })
}

/**
 * Show a toast message with info styling
 *
 * @param text Message to be shown in the toast, any HTML is removed by default
 * @param options
 */
export function showInfo(text: string, options?: ToastOptions): Toast {
	return showMessage(text, { ...options, type: ToastType.INFO })
}

/**
 * Show a toast message with success styling
 *
 * @param text Message to be shown in the toast, any HTML is removed by default
 * @param options
 */
export function showSuccess(text: string, options?: ToastOptions): Toast {
	return showMessage(text, { ...options, type: ToastType.SUCCESS })
}
