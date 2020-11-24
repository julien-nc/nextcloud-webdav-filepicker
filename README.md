# <a id='s1' />📂 Nextcloud WebDav file picker

![pages](https://github.com/eneiluj/nextcloud-webdav-filepicker/workflows/build-pages/badge.svg?branch=master&event=push)

The Nextcloud WebDav file picker is a web component to access Nextcloud files.

It requires the [WebAppPassword](https://apps.nextcloud.com/apps/webapppassword) to be installed on the target Nextcloud server.

# Table of Contents
* [📂 Nextcloud WebDav file picker](#s1)
* [ 👀 Demo](#s2)
* [ ▶ Introduction](#s3)
  * [Features](#s3-1)
  * [Authentication](#s3-2)
  * [How to include it](#s3-3)
* [ ✨ The wrapper](#s4)
  * [Example](#s4-1)
  * [Events](#s4-2)
* [ 🇻 The Vue component](#s5)
  * [Example](#s5-1)
  * [Props](#s5-2)
  * [Slots](#s5-3)
  * [Events](#s5-4)
* [ 🔧 More information](#s6)
  * [WebAppPassword app and CORS headers](#s6-1)
  * [Restrictions with OAuth access tokens](#s6-2)
  * [Create Nextcloud share links](#s6-3)
  * [Save downloaded files](#s6-4)
  * [Demo pages GET parameters](#s6-5)

# <a id='s2' /> 👀 Demo

* [Example of Vue application using the component](https://eneiluj.github.io/nextcloud-webdav-filepicker/examples/with-vue.html)
* [Example of simple script using the file picker wrapper](https://eneiluj.github.io/nextcloud-webdav-filepicker/examples/without-vue.html)

See how to [pass GET parameters](#demo-pages-get-parameters)

# <a id='s3' /> ▶ Introduction

## <a id='s3-1' />Features

This file picker is able to

* Select multiple files and:
	* Get their path
	* Download them as [Files](https://developer.mozilla.org/en-US/docs/Web/API/File)
	* Generate WebDav download links
	* Help you to easily generate Nextcloud share links
* Select a target directory and:
	* Get its path
	* Generate a WebDav upload link
* Upload local files

## <a id='s3-2' />Authentication

🔒 Supported authentication methods are:

* Provide a login and:
	* a classic password
	* an app password
	* an OAuth bearer token (see [OAuth token](#restrictions-with-oauth-access-tokens))
* Let the file picker authenticate on its own with the web login flow

⚠ A login is still required if you want to use an OAuth token.

## <a id='s3-3' />How to include it

There are two ways to include this file picker in your web application:

* A Vue.js component
* A wrapper script

The file picker can optionally show buttons to open it an perform actions. You can also use your own custom elements (anywhere in your application) to trigger the file picker actions.

# <a id='s4' /> ✨ The wrapper

Get it from NPM (⚠ **not available yet**):
```
npm install @nextcloud/webdav-filepicker
```

And use it:
```
import '@nextcloud/webdav-filepicker/js/filePickerWrapper'
```

Once you've imported `filePickerWrapper.js` you can call the `window.createFilePicker()` function
to mount the file picker somewhere in your web page. This function returns the component to let you interact with it later.

Parameters of `createFilePicker(mountPoint, url, login, password, accessToken, color, darkModeEnabled, multipleDownload, multipleUpload, enableGetFilesPath, enableGetFilesLink, enableDownloadFiles, enableGetSaveFilePath, enableGetUploadFileLink, enableUploadFiles)` function:

* mountPoint (String): the ID of the element in which the file picker is mounted
* url (string, mandatory): the Nextcloud base URL
* login (string): the user name
* password (string): the user password, an app password or an OAuth access token
* accessToken (string): an OAuth token (use this parameter if you absolutely want to use HTTP Authorization header to authenticate. Using the OAuth token as a password is recommended, see [OAuth token](#restrictions-with-oauth-access-tokens))
* color (hex color string): the main file picker color (default: Nextcloud blue, `#0082c9`)
* darkModeEnabled (boolean): toggle the dark theme (default: false)
* multipleDownload (boolean): let the user select multiple files in the file picker (default: `true`)
* multipleUpload (boolean): let the user select multiple local files to upload (default: `true`)
* enableGetFilesPath (boolean): show the "Get files path" button (default: `true`)
* enableGetFilesLink (boolean): show the "Get files link" button (default: `true`)
* enableDownloadFiles (boolean): show the "Get files link" button (default: `true`)
* enableGetSaveFilePath (boolean): show the "Get files link" button (default: `true`)
* enableGetUploadFileLink (boolean): show the "Get files link" button (default: `true`)
* enableUploadFiles (boolean): show the "Upload files" button (default: `true`)

Set login and password/accessToken to `null` to let the file picker authenticate through the web login flow and get an app password by itself.

## <a id='s4-1' />Example

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
			console.debug(e.detail.selection)
			e.detail.selection.forEach((path) => {
				console.debug(path)
			})
		})
	})
</script>
```

## <a id='s4-2' />Events

Here are the events emitted by the component and the data they provide in the `detail` attribute:

* `filepicker-unauthorized`: when a WebDav request faced a 401 response code
	* `response`: the response object
* `get-files-path`: files were selected
	* `selection`: an array of file paths
* `files-downloaded`: files were downloaded
	* `successFiles` array of [Files](https://developer.mozilla.org/en-US/docs/Web/API/File)
	* `errorFilePaths` array of path
* `get-files-link`: links were generated
	* `webdavLinks` an array of Webdav download links
	* `pathList` list of selected paths
	* `ocsUrl` OCS API URL to [create Nextcloud share links](#create-nextcloud-share-links)
	* `genericShareLink` an example of share link with "TOKEN" as the token value
* `get-save-file-path`: a target directory was selected
	* `path` the path of the selected target directory
* `upload-path-link-generated`: WebDav upload link was generated
	* `link` a WebDav upload link
	* `targetDir` the target directory path
* `files-uploaded`:
	* `successFiles` array of successfully uploaded [Files](https://developer.mozilla.org/en-US/docs/Web/API/File)
	* `errorFiles` array of [Files](https://developer.mozilla.org/en-US/docs/Web/API/File)
	* `targetDir` the target directory path

# <a id='s5' /> 🇻 The Vue component

Get it from NPM (⚠ **not available yet**):
```
npm install @nextcloud/webdav-filepicker
```

And use it:
```
import NcFilePicker from '@nextcloud/webdav-filepicker'
```

## <a id='s5-1' />Example

Here is a minimal example of a Vue.js app using the file picker:
``` vue
<template>
	<div id="example-app">
		<h2>My amazing app</h2>
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

	components: { NcFilePicker },

	props: [],

	data() {
		return {
			ncUrl: 'https://my.nextcloud.org',
		}
	},

	computed: {
	},

	methods: {
		onGetFilesPath(detail) {
			console.debug('files were selected')
			console.debug(detail.selection)
		},
	},
}
</script>
```

## <a id='s5-2' />Props

``` javascript
/* === reactive props === */
// Nextcloud base URL
ncUrl: {
	type: String,
	required: true,
},
// Nextcloud user name
ncLogin: {
	type: String,
	default: '',
},
// Nextcloud user password/app password/OAuth access token
ncPassword: {
	type: String,
	default: '',
},
// OAuth access token if you absolutely want to use Bearer Authorization header (if not, using a token as a password works fine)
ncAccessToken: {
	type: String,
	default: '',
},
/* === props to control the fp component from the parent one === */
// file picker mode to determine what is done when the picker is opened
pickerMode: {
	type: String,
	default: '',
},
// prop to open the file picker if you don't want to use the buttons
pickerIsOpen: {
	type: Boolean,
	default: false,
},
/* === options === */
// enable multiple selection in all download modes
multipleDownload: {
	type: Boolean,
	default: true,
},
// enable multiple local files selection when uploading
multipleUpload: {
	type: Boolean,
	default: true,
},
// file picker title
getTitle: {
	type: String,
	default: null,
},
putTitle: {
	type: String,
	default: null,
},
// theming (reactive too)
themeColor: {
	type: String,
	default: '#0082c9',
	validator: (value) => {
		return value.match(/^#[0-9a-fA-F]{6}$/)
	},
},
darkMode: {
	type: Boolean,
	default: false,
},
/* === toggle buttons === */
// display the button to get files path
enableGetFilesPath: {
	type: Boolean,
	default: true,
},
// display the button to get files links
enableGetFilesLink: {
	type: Boolean,
	default: true,
},
// display the button to download files
enableDownloadFiles: {
	type: Boolean,
	default: true,
},
// display the button to get a save file path
enableGetSaveFilePath: {
	type: Boolean,
	default: true,
},
// display the button to get webdav upload link
enableGetUploadFileLink: {
	type: Boolean,
	default: true,
},
// display the button to upload local files
enableUploadFiles: {
	type: Boolean,
	default: true,
},
```

## <a id='s5-3' />Slots

There is a slot for each button that triggers a file picker action:

* get-files-path
* get-files-link
* download-files
* get-save-file-path
* get-upload-fileLink
* open-file-input

The click event is catched by the file picker component, no need to listen to it. So you can put whatever you want in those slots, a click anywhere in the slot will open the file picker just like if the default button was clicked.

## <a id='s5-4' />Events

Those events are emitted by the component and the data included in the associated object:

* `closed`: when the file picker is closed, whatever the reason (no associated data)
* `manually-closed`: when the user closes the file picker with the top right close icon (no associated data)
* `filepicker-unauthorized`: when a WebDav request faced a 401 response code
	* `response`: the response object
* `get-files-path`: files were selected
	* `selection`: an array of file paths
* `files-downloaded`: files were downloaded
	* `successFiles` array of [Files](https://developer.mozilla.org/en-US/docs/Web/API/File)
	* `errorFilePaths` array of path
* `get-files-link`: links were generated
	* `webdavLinks` an array of Webdav download links
	* `pathList` list of selected paths
	* `ocsUrl` OCS API URL to [create Nextcloud share links](#create-nextcloud-share-links)
	* `genericShareLink` an example of share link with "TOKEN" as the token value
* `get-save-file-path`: a target directory was selected
	* `path` the path of the selected target directory
* `upload-path-link-generated`: WebDav upload link was generated
	* `link` a WebDav upload link
	* `targetDir` the target directory path
* `files-uploaded`:
	* `successFiles` array of successfully uploaded [Files](https://developer.mozilla.org/en-US/docs/Web/API/File)
	* `errorFiles` array of [Files](https://developer.mozilla.org/en-US/docs/Web/API/File)
	* `targetDir` the target directory path

# <a id='s6' /> 🔧 More information

## <a id='s6-1' />WebAppPassword app and CORS headers

Nextcloud includes restrictive CORS headers preventing browsers to perform API requests. WebAppPassword app lets Nextcloud admins set a whitelist of allowed origins for WebDav requests. As the file picker will be included in your web application outside of Nextcloud, your website's domain needs to be whilelisted in order to make WebDav requests.

## <a id='s6-2' />Restrictions with OAuth access tokens

[WebDav client](https://www.npmjs.com/package/webdav) is not able to generate WebDav download/upload links if the authentication is done via Bearer Authorization (if you pass the OAuth token as the `ncAccessToken` prop).
You can still use an OAuth token to authenticate, just use it like a normal password and pass it as the `ncPassword` prop. As Nextcloud basic auth supports OAuth tokens, everything will work fine.

## <a id='s6-3' />Create Nextcloud share links

As long as CORS headers can't be changed to allow extra origins (like it's done with WebDav endpoints in WebAppPassword), the browser can't create new share links.
You can still do it anywhere else, on the server side of your web application for example. The `get-files-link` event provides a share link template and the OCS URL to create such share links. The OCS API endpoint looks like `https://my.nextcloud.org/ocs/v2.php/apps/files_sharing/api/v1/shares`.

Here is an example of link creation:

```
curl -H "OCS-APIRequest: true" -u login:token -X POST -d "path=/path/to/file&shareType=3" "$OCS_URL"
```

This will create and return a share link (shareType=3) with default permissions. The share token can be found in `ocs.data.token` of the JSON response. Then just place the token in the share link template. For example, if `get-files-link` gave you `https://my.nextcloud.org/index.php/s/TOKEN` as share link template and the token of the link you created is `wHx2BteGayciKiA`, then the share link is `https://my.nextcloud.org/index.php/s/wHx2BteGayciKiA`.

## <a id='s6-4' />Save downloaded files

You can allow users to save the files downloaded by the file picker. As the returned objects are Files (subclass of Blobs), you can use [file-saver](https://www.npmjs.com/package/file-saver) to open a save file dialog and let the browser write the files to local filesystem.

## <a id='s6-5' />Demo pages GET parameters

You can pass GET parameters to demo pages in order to initialize field values. It makes it easier to provide demo links directly working. For example:

https://eneiluj.github.io/nextcloud-webdav-filepicker/examples/with-vue.html?url=https://my.nextcloud.org&login=jason&password=Nm8cC-kHczM-HGz55-S9SE2-Frf4F&color=aa82c9&darkmode=1 (url, login and password are examples)

Accepted parameters are:
* url
* login
* password
* accessToken
* color (hex color without hash prefix, example: 'aa82c9')
* darkMode ('1' is true, anything else is false)