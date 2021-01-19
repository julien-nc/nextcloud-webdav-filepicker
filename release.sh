#!/bin/bash

export NPM_TOKEN=`cat ~/.nextcloud/secrets/NPM_TOKEN | tr -d '\n'`
npm ci
npm run build
NPM_CONFIG_TOKEN=$NPM_TOKEN npm publish
