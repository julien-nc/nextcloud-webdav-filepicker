# Nextcloud webdav file picker

![pages](https://github.com/eneiluj/nextcloud-webdav-filepicker/workflows/build-pages/badge.svg?branch=master&event=push)

* [Example of Vue application using the component](https://eneiluj.github.io/nextcloud-webdav-filepicker/examples/with-vue.html)
* [Example of simple script using the file picker wrapper](https://eneiluj.github.io/nextcloud-webdav-filepicker/examples/without-vue.html)

## Intro

This file picker is able to

* select multiple files and get their path
* select multiple files and download them as [Files](https://developer.mozilla.org/en-US/docs/Web/API/File)
* select multiple files and generate WebDav download links
* select a target directory and get its path
* select a target directory and generate a WebDav upload link
* upload local files

There are two ways to use this file picker:

* include the component in a Vue.js application
* import a wrapper script providing abstraction functions

## The wrapper

Once you've imported `filePickerWrapper.js` you can call the `window.createFilePicker()` function
to mount the file picker somewhere in your web page. This function returns the component to let you interact with it later.

Parameters of `createFilePicker(mountPoint, url, login, password, color, enableGetFilesPath)` function:

* mountPoint (String): the id of the element in which the file picker is mounter
* url (string): the Nextcloud base URL
* login (string): the user name
* password (string): the user password or an app password
* color (hex color string): the main file picker color (default: Nextcloud blue)
* multipleDownload (boolean): let the user select multiple files in the file picker (default: true)
* multipleUpload (boolean): let the user select multiple local files to upload (default: true)
* enableGetFilesPath (boolean): show the "Get files path" button (default: true)
* enableGetFilesLink (boolean): show the "Get files link" button
* enableDownloadFiles (boolean): show the "Get files link" button (default: true)
* enableGetSaveFilePath (boolean): show the "Get files link" button (default: true)
* enableGetUploadFileLink (boolean): show the "Get files link" button (default: true)
* enableUploadFiles (boolean): show the "Upload files" button (default: true)

Set login and password to `null` to let the file picker authenticate through the web login flow and get an app password by its own.

Here is a minimal example getting files paths and displaying them in the console:

``` html
<div id="mount_point"></div>
<script src="filePickerWrapper.js"></script>
<script>
	document.addEventListener('DOMContentLoaded', (event) => {
        const filepicker = window.createFilePicker('mount_point', 'https://my.nextcloud.org', null, null, null, true)

		// event coming from the file picker
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

Here is a list of events and the data they provide:

* `get-files-path`: an array of file paths
* `files-downloaded`: an array of [Files](https://developer.mozilla.org/en-US/docs/Web/API/File)
* `get-files-link`: an array of Webdav download links
* `get-save-file-path`: the path of the selected target directory
* `upload-path-link-generated`: a WebDav upload link
* `files-uploaded`: an array of uploaded [Files](https://developer.mozilla.org/en-US/docs/Web/API/File)

## The Vue component

NYI :wink: