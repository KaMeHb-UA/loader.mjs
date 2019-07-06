# loader.mjs
## What is this
This is a module loader that allows you to load ES6 modules directly from internet like browsers do (for this time `https` protocol is only supported)
## How to use it
1. [Download loader.mjs](https://raw.githubusercontent.com/KaMeHb-UA/loader.mjs/master/loader.mjs) and place it somewhere
2. Import modules to your script like
```javascript
import module from 'https://cdn.jsdelivr.net/somelib@1/index.mjs'
```
3. Launch your script with additional node `--loader` parameter like this:
```shell
node --experimental-modules --loader "path-to-loader.mjs" ./my-script.mjs
```
