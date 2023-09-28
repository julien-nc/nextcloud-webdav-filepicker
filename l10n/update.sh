#!/bin/bash

APP_NAME=nextcloud-webdav-filepicker
rm -rf /tmp/$APP_NAME
git clone https://github.com/julien-nc/$APP_NAME /tmp/$APP_NAME -b l10n_main --single-branch
cp -r /tmp/$APP_NAME/translationfiles/[a-z][a-z]_[A-Z][A-Z] ../translationfiles/
rm -rf /tmp/$APP_NAME

echo "files copied"
