#!/bin/bash

APP_NAME=nextcloud-webdav-filepicker
cd ..
rm -rf /tmp/fpjs
mv js /tmp/fpjs
mv node_modules /tmp/node_modules_fp
translationtool.phar create-pot-files
mv /tmp/fpjs js
mv /tmp/node_modules_fp node_modules
cd -
