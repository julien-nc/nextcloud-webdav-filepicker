# @nextcloud/dialogs

Nextcloud dialog helpers

## Installation

```
npm i -S @nextcloud/dialogs
```

## Usage

### Toasts

```js
import { showMessage, showInfo, showSuccess, showWarning, showError } from '@nextcloud/dialogs'
import '@nextcloud/dialogs/styles/toast.scss'
```

Make sure that the  `@nextcloud/dialogs/styles/toast` file is included in your app to make sure that the toasts have a proper styling applied.

There are different toast styles available, that are exposed in separate functions:

```
showMessage('Message without a specific styling')
showInfo('Information')
showSuccess('Success')
showWarning('Warning')
showError('Error')
```

There are several options that can be passed in as a second parameter, like the timeout of a toast:

```
showError('This is an error shown without a timeout', { timeout: -1 })
```

A full list of available options can be found in the [documentation](https://nextcloud.github.io/nextcloud-dialogs/).
