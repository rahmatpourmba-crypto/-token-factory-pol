12:14:53 PM: build-image version: 969defd95f3977f8de9cb1f48802a7e6f3d8c0b3 (noble-new-builds)
12:14:53 PM: buildbot version: b34371363d3ca30c2d1b8c0c23cb261247d6f156
12:14:53 PM: Building with cache
12:14:53 PM: Starting to prepare the repo for build
12:14:53 PM: Preparing Git Reference pull/5/head
12:14:54 PM: Custom build path detected. Proceeding with the specified path: 'site'
12:14:54 PM: Custom publish path detected. Proceeding with the specified path: 'site/dist'
12:14:54 PM: Installing dependencies
12:14:55 PM: mise ~/.config/mise/config.toml tools: python@3.14.3
12:14:55 PM: mise ~/.config/mise/config.toml tools: ruby@3.4.8
12:14:55 PM: mise ~/.config/mise/config.toml tools: go@1.26.2
12:14:55 PM: v24.18.0 is already installed.
12:14:55 PM: Now using node v24.18.0 (npm v11.16.0)
12:14:56 PM: Enabling Node.js Corepack
12:14:56 PM: No npm workspaces detected
12:14:56 PM: Installing npm packages using npm version 11.16.0
12:14:57 PM: up to date in 1s
12:14:57 PM: npm warn allow-scripts 4 packages have install scripts not yet covered by allowScripts:
12:14:57 PM: npm warn allow-scripts   bufferutil@4.1.0 (install: node-gyp rebuild)
12:14:57 PM: npm warn allow-scripts   esbuild@0.21.5 (install: (install scripts present))
12:14:57 PM: npm warn allow-scripts   keccak@3.0.4 (install: node-gyp rebuild)
12:14:57 PM: npm warn allow-scripts   utf-8-validate@5.0.10 (install: node-gyp rebuild)
12:14:57 PM: npm warn allow-scripts
12:14:57 PM: npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.
12:14:57 PM: npm packages installed
12:14:57 PM: Successfully installed dependencies
12:14:57 PM: Detected 1 framework(s)
12:14:57 PM: "vite" at version "5.4.21"
12:14:57 PM: Starting build script
12:14:59 PM: Section completed: initializing
12:15:01 PM: ​
12:15:01 PM: Netlify Build                                                 
12:15:01 PM: ────────────────────────────────────────────────────────────────
12:15:01 PM: ​
12:15:01 PM: ❯ Version
12:15:01 PM:   @netlify/build 36.1.5
12:15:01 PM: ​
12:15:01 PM: ❯ Flags
12:15:01 PM:   accountId: 6a48142cc4045c20dbc05c65
12:15:01 PM:   baseRelDir: true
12:15:01 PM:   buildId: 6a5f3184b218ae7fb758ebed
12:15:01 PM:   deployId: 6a5f3184b218ae7fb758ebef
12:15:01 PM: ​
12:15:01 PM: ❯ Current directory
12:15:01 PM:   /opt/build/repo/site
12:15:01 PM: ​
12:15:01 PM: ❯ Config file
12:15:01 PM:   /opt/build/repo/site/netlify.toml
12:15:01 PM: ​
12:15:01 PM: ❯ Context
12:15:01 PM:   deploy-preview
12:15:01 PM: ​
12:15:01 PM: build.command from netlify.toml                               
12:15:01 PM: ────────────────────────────────────────────────────────────────
12:15:01 PM: ​
12:15:01 PM: $ npm run build
12:15:02 PM: > token-factory-site@1.0.0 build
12:15:02 PM: > vite build
12:15:02 PM: vite v5.4.21 building for production...
12:15:02 PM: transforming...
12:15:03 PM: ✓ 7 modules transformed.
12:15:03 PM: x Build failed in 736ms
12:15:03 PM: error during build:
12:15:03 PM: [vite:esbuild] Transform failed with 1 error:
12:15:03 PM: /opt/build/repo/site/src/App.jsx:28:20: ERROR: Expected "}" but found "حال"
12:15:03 PM: file: /opt/build/repo/site/src/App.jsx:28:20
12:15:03 PM: 
12:15:03 PM: Expected "}" but found "حال"
12:15:03 PM: 26 |        previewTitle: 'پیش‌نمایش اطلاعات توکن',
12:15:03 PM: 27 |        mintButton: 'تایید و ساخت توکن',
12:15:03 PM: 28 |        minting: در حال پردازش قرارداد هوشمند...,
12:15:03 PM:    |                      ^
12:15:03 PM: 29 |        successMsg: 'توکن شما با موفقیت در شبکه پالیگان ایجاد شد!',
12:15:03 PM: 30 |
12:15:03 PM: 
12:15:03 PM:     at failureErrorWithLog (/opt/build/repo/site/node_modules/esbuild/lib/main.js:1472:15)
12:15:03 PM:     at /opt/build/repo/site/node_modules/esbuild/lib/main.js:755:50
12:15:03 PM:     at responseCallbacks.<computed> (/opt/build/repo/site/node_modules/esbuild/lib/main.js:622:9)
12:15:03 PM:     at handleIncomingPacket (/opt/build/repo/site/node_modules/esbuild/lib/main.js:677:12)
12:15:03 PM:     at Socket.readFromStdout (/opt/build/repo/site/node_modules/esbuild/lib/main.js:600:7)
12:15:03 PM:     at Socket.emit (node:events:509:28)
12:15:03 PM:     at addChunk (node:internal/streams/readable:563:12)
12:15:03 PM:     at readableAddChunkPushByteMode (node:internal/streams/readable:514:3)
12:15:03 PM:     at Readable.push (node:internal/streams/readable:394:5)
12:15:03 PM:     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)
12:15:03 PM: ​
12:15:03 PM: "build.command" failed                                        
12:15:03 PM: ────────────────────────────────────────────────────────────────
12:15:03 PM: ​
12:15:03 PM:   Error message
12:15:03 PM:   Command failed with exit code 1: npm run build (https://ntl.fyi/exit-code-1)
12:15:03 PM: ​
12:15:03 PM:   Error location
12:15:03 PM:   In build.command from netlify.toml:
12:15:03 PM:   npm run build
12:15:03 PM: ​
12:15:03 PM:   Resolved config
12:15:03 PM:   build:
12:15:03 PM:     base: /opt/build/repo/site
12:15:03 PM:     command: npm run build
12:15:03 PM:     commandOrigin: config
12:15:03 PM:     environment:
12:15:03 PM:       - REVIEW_ID
12:15:03 PM:     publish: /opt/build/repo/site/dist
12:15:03 PM:     publishOrigin: config
12:15:03 PM:   redirects:
12:15:03 PM:     - from: /*
12:15:03 PM:       status: 200
12:15:03 PM:       to: /index.html
12:15:03 PM:   redirectsOrigin: config
12:15:03 PM: Build failed due to a user error: Build script returned non-zero exit code: 2
12:15:04 PM: Failed during stage 'building site': Build script returned non-zero exit code: 2 (https://ntl.fyi/exit-code-2)
12:15:04 PM: Failing build: Failed to build site
12:15:06 PM: Finished processing build request in 10.982s
