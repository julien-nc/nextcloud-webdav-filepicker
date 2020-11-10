# 📂 Nextcloud WebDav file picker

![pages](https://github.com/eneiluj/nextcloud-webdav-filepicker/workflows/build-pages/badge.svg?branch=master&event=push)

The Nextcloud WebDav file picker is a web component to access Nextcloud files.

It requires the [WebAppPassword](https://apps.nextcloud.com/apps/webapppassword) to be installed on the target Nextcloud server.

## Demo

* [Example of Vue application using the component](https://eneiluj.github.io/nextcloud-webdav-filepicker/examples/with-vue.html)
* [Example of simple script using the file picker wrapper](https://eneiluj.github.io/nextcloud-webdav-filepicker/examples/without-vue.html)

## Intro

### Features

This file picker is able to

* select multiple files and:
	* get their path
	* download them as [Files](https://developer.mozilla.org/en-US/docs/Web/API/File)
	* generate WebDav download links
	* help you to easily generate Nextcloud share links
* select a target directory and:
	* get its path
	* generate a WebDav upload link
* upload local files

### Authentication

🔒 Supported authentication methods are:

* Provide a login and:
	* a classic password
	* an app password
	* an OAuth bearer token
* Let the file picker authenticate on its own with the web login flow

⚠ A login is still required if you want to use an OAuth token.

### How to include it

There are two ways to include this file picker in your web application:

* A Vue.js component
* A wrapper script

The file picker can optionally show buttons to open it an perform actions. You can also use your own custom elements (anywhere in your application) to trigger the file picker actions.

## The wrapper

Once you've imported `filePickerWrapper.js` you can call the `window.createFilePicker()` function
to mount the file picker somewhere in your web page. This function returns the component to let you interact with it later.

Parameters of `createFilePicker(mountPoint, url, login, password, accessToken, color, multipleDownload, multipleUpload, enableGetFilesPath, enableGetFilesLink, enableDownloadFiles, enableGetSaveFilePath, enableGetUploadFileLink, enableUploadFiles)` function:

* mountPoint (String): the ID of the element in which the file picker is mounted
* url (string, mandatory): the Nextcloud base URL
* login (string): the user name
* password (string): the user password, an app password or an OAuth access token
* accessToken (string): an OAuth token (use this parameter if you absolutely want to use HTTP Authorization header to authenticate. Using the OAuth token as a password is recommended)
* color (hex color string): the main file picker color (default: Nextcloud blue, `#0082c9`)
* multipleDownload (boolean): let the user select multiple files in the file picker (default: `true`)
* multipleUpload (boolean): let the user select multiple local files to upload (default: `true`)
* enableGetFilesPath (boolean): show the "Get files path" button (default: `true`)
* enableGetFilesLink (boolean): show the "Get files link" button (default: `true`)
* enableDownloadFiles (boolean): show the "Get files link" button (default: `true`)
* enableGetSaveFilePath (boolean): show the "Get files link" button (default: `true`)
* enableGetUploadFileLink (boolean): show the "Get files link" button (default: `true`)
* enableUploadFiles (boolean): show the "Upload files" button (default: `true`)

Set login and password/accessToken to `null` to let the file picker authenticate through the web login flow and get an app password by itself.

### Example

Here is a minimal example getting files paths and displaying them in the console:

``` html
<!-- The component will be mounted there -->
<div id="mount_point"></div>
<!-- Import the wrapper -->
<script src="filePickerWrapper.js"></script>
<script>
	// when the page is loaded
	document.addEventListener('DOMContentLoaded', (event) => {
		// create and mount the component
		const filepicker = window.createFilePicker('mount_point', 'https://my.nextcloud.org')

		// listen to events coming from the component
		document.addEventListener('get-files-path', (e) => {
			console.debug('received "get-files-path" event')
			console.debug(e.detail)
			e.detail.forEach((path) => {
				console.debug(path)
			})
		})
	})
</script>
```

### Events

Here are the events emitted by the component and the data they provide:

* `get-files-path`: an array of file paths
* `files-downloaded`: `successFiles` and `errorFiles`, arrays of [Files](https://developer.mozilla.org/en-US/docs/Web/API/File)
* `get-files-link`:
	* `webdavLinks` an array of Webdav download links
	* `pathList` list of selected paths
	* `ocsUrl` OCS API URL to [create Nextcloud share links](#create-nextcloud-share-links)
* `get-save-file-path`: the path of the selected target directory
* `upload-path-link-generated`: a WebDav upload link
* `files-uploaded`: `successFiles` and `errorFiles`, arrays of uploaded [Files](https://developer.mozilla.org/en-US/docs/Web/API/File)

## The Vue component

Get it from NPM (**not yet available**):
```
npm install nextcloud-webdav-filepicker
```

And use it:
```
import NcFilePicker from 'nextcloud-webdav-filepicker'
```

### Example

Here is a minimal example of a Vue.js app using the file picker:
``` vue
<template>
	<div id="example-app">
		<h2>
			My amazing app
		</h2>
		<NcFilePicker
			:nc-url="ncUrl"
			@get-files-path="onGetFilesPath">
		</NcFilePicker>
	</div>
</template>

<script>
import NcFilePicker from 'nextcloud-webdav-filepicker'

export default {
	name: 'ExampleApp',

	components: {
		NcFilePicker,
	},

	props: [],

	data() {
		return {
			ncUrl: 'https://my.nextcloud.org',
		}
	},

	computed: {
	},

	methods: {
		onGetFilesPath(pathList) {
			console.debug('files were selected')
			console.debug(pathList)
		},
	},
}
</script>
```

## Extra

### Create Nextcloud share links