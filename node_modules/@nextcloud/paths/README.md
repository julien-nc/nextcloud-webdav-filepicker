# @nextcloud/paths

[![Build Status](https://travis-ci.com/nextcloud/nextcloud-paths.svg?branch=master)](https://travis-ci.com/nextcloud/nextcloud-paths)
[![npm](https://img.shields.io/npm/v/@nextcloud/paths.svg)](https://www.npmjs.com/package/@nextcloud/paths)
[![Documentation](https://img.shields.io/badge/Documentation-online-brightgreen)](https://nextcloud.github.io/nextcloud-paths/)

Path helpers for Nextcloud apps.

## Installation

```
npm i -S @nextcloud/paths
```

## Usage

```js
import { basename, dirname, encodePath, isSamePath, joinPaths } from '@nextcloud/paths'

basename('/my/file.txt')
// -> 'file.txt'

dirname('/my/file.txt')
// -> '/my'

encodePath('/my/other file.txt')
// -> '/my/other%20file'

isSamePath('/my/file.txt', 'my/file.txt')
// -> true

basename('/my/file.txt')
// -> 'file.txt'
```

