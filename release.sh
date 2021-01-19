#!/bin/bash

NPM_TOKEN=`cat ~/.nextcloud/secrets/NPM_TOKEN | tr -d '\n'`
npm ci
npm run build
npm publish
