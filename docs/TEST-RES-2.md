[90mstderr[2m | tests/e2e/error-scenarios.test.ts[2m > [22m[2mE2E Error Scenarios & Recovery[2m > [22m[2mDatabase Connection Failures[2m > [22m[2mshould handle session creation with database unavailable
[22m[39mFailed to create session: Error: Database connection timeout
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/e2e/error-scenarios.test.ts:59:51
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/e2e/error-scenarios.test.ts[2m > [22m[2mE2E Error Scenarios & Recovery[2m > [22m[2mDatabase Connection Failures[2m > [22m[2mshould handle message persistence failures while maintaining delivery
[22m[39mDatabase persistence failed: Error: Database write failed
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/e2e/error-scenarios.test.ts:86:58
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/e2e/error-scenarios.test.ts[2m > [22m[2mE2E Error Scenarios & Recovery[2m > [22m[2mDatabase Connection Failures[2m > [22m[2mshould recover from database outage
[22m[39mFailed to create session: Error: Database unavailable
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/e2e/error-scenarios.test.ts:113:55
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/e2e/error-scenarios.test.ts[2m > [22m[2mE2E Error Scenarios & Recovery[2m > [22m[2mWebSocket Connection Failures[2m > [22m[2mshould handle WebSocket send failures gracefully
[22m[39mFailed to send message to user 123: Error: Connection closed
    at Object.<anonymous> [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/e2e/error-scenarios.test.ts:148:15[90m)[39m
    at Object.mockCall [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/spy/dist/index.js:96:15[90m)[39m
    at Object.spy [as send] [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4mtinyspy[24m/dist/index.js:47:103[90m)[39m
    at WebSocketManager.sendToUser [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mserver/websocket-manager.ts:61:19[90m)[39m
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/e2e/error-scenarios.test.ts:154:33
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m

[90mstderr[2m | tests/e2e/error-scenarios.test.ts[2m > [22m[2mE2E Error Scenarios & Recovery[2m > [22m[2mWebSocket Connection Failures[2m > [22m[2mshould handle broadcasting to mixed connection states
[22m[39mFailed to send message to user 456: Error: Send failed
    at Object.<anonymous> [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/e2e/error-scenarios.test.ts:204:15[90m)[39m
    at Object.mockCall [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/spy/dist/index.js:96:15[90m)[39m
    at Object.spy [as send] [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4mtinyspy[24m/dist/index.js:47:103[90m)[39m
    at WebSocketManager.sendToUser [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mserver/websocket-manager.ts:61:19[90m)[39m
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mserver/websocket-manager.ts:78:14
    at Map.forEach (<anonymous>)
    at WebSocketManager.broadcast [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mserver/websocket-manager.ts:76:22[90m)[39m
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/e2e/error-scenarios.test.ts:214:30
    at Proxy.assertThrows [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4mchai[24m/chai.js:2723:5[90m)[39m
    at Proxy.methodWrapper [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4mchai[24m/chai.js:1618:25[90m)[39m

[90mstderr[2m | tests/e2e/error-scenarios.test.ts[2m > [22m[2mE2E Error Scenarios & Recovery[2m > [22m[2mSignaling Protocol Errors[2m > [22m[2mshould handle signaling to non-existent sessions
[22m[39mNo target user found for offer in session 99999

[90mstderr[2m | tests/e2e/error-scenarios.test.ts[2m > [22m[2mE2E Error Scenarios & Recovery[2m > [22m[2mSignaling Protocol Errors[2m > [22m[2mshould handle signaling from unauthorized users
[22m[39mNo target user found for offer in session 4320

[90mstderr[2m | tests/e2e/error-scenarios.test.ts[2m > [22m[2mE2E Error Scenarios & Recovery[2m > [22m[2mSystem Recovery[2m > [22m[2mshould recover gracefully from temporary service unavailability
[22m[39mFailed to create session: Error: Service temporarily unavailable
    at Object.<anonymous> [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/e2e/error-scenarios.test.ts:460:33[90m)[39m
    at Object.mockCall [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/spy/dist/index.js:96:15[90m)[39m
    at Object.spy [as createSession] [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4mtinyspy[24m/dist/index.js:47:103[90m)[39m
    at SessionManager.createSession [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mserver/session-manager.ts:71:44[90m)[39m
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/e2e/error-scenarios.test.ts:473:35
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m

[90mstderr[2m | tests/e2e/error-scenarios.test.ts[2m > [22m[2mE2E Error Scenarios & Recovery[2m > [22m[2mSystem Recovery[2m > [22m[2mshould maintain system stability during cascading failures
[22m[39mFailed to create session: Error: Database cascade failure
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/e2e/error-scenarios.test.ts:507:51
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m
Database persistence failed: Error: Message service cascade failure
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/e2e/error-scenarios.test.ts:508:58
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/e2e/message-reliability.test.ts[2m > [22m[2mE2E Message Reliability[2m > [22m[2mMessage Persistence Reliability[2m > [22m[2mshould handle database failures gracefully
[22m[39mDatabase persistence failed: Error: Database connection failed
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/e2e/message-reliability.test.ts:388:58
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/e2e/message-reliability.test.ts[2m > [22m[2mE2E Message Reliability[2m > [22m[2mMessage Persistence Reliability[2m > [22m[2mshould retry failed message persistence
[22m[39mDatabase persistence failed: Error: Temporary database error
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/e2e/message-reliability.test.ts:411:32
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/unit/session-manager.test.ts[2m > [22m[2mSessionManager[2m > [22m[2mSession Termination[2m > [22m[2mshould handle ending non-existent session gracefully
[22m[39mAttempted to end non-existent session 99999

[90mstderr[2m | tests/unit/session-api.test.ts[2m > [22m[2mSessionAPI[2m > [22m[2mSession Creation[2m > [22m[2mshould handle advisor unavailability
[22m[39mError starting session: Error: Advisor not available
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/unit/session-api.test.ts:123:67
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/unit/session-api.test.ts[2m > [22m[2mSessionAPI[2m > [22m[2mSession Status Management[2m > [22m[2mshould handle non-existent session
[22m[39mError getting session status: Error: Session not found
    at SessionAPI.getSessionStatus [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mserver/session-api.ts:120:15[90m)[39m
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/unit/session-api.test.ts:167:31
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/unit/session-api.test.ts[2m > [22m[2mSessionAPI[2m > [22m[2mSession Participation[2m > [22m[2mshould handle leaving non-existent session
[22m[39mError leaving session: Error: User not in session
    at SessionAPI.leaveSession [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mserver/session-api.ts:203:15[90m)[39m
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/unit/session-api.test.ts:240:31
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/unit/session-api.test.ts[2m > [22m[2mSessionAPI[2m > [22m[2mSession Notes Management[2m > [22m[2mshould validate notes permissions
[22m[39mError updating session notes: Error: Unauthorized to update session notes
    at SessionAPI.updateSessionNotes [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mserver/session-api.ts:322:15[90m)[39m
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/unit/session-api.test.ts:382:31
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/unit/session-api.test.ts[2m > [22m[2mSessionAPI[2m > [22m[2mSession Notes Management[2m > [22m[2mshould prevent notes update on active sessions
[22m[39mError updating session notes: Error: Cannot update notes on active session
    at SessionAPI.updateSessionNotes [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mserver/session-api.ts:327:15[90m)[39m
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/unit/session-api.test.ts:397:31
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/unit/session-api.test.ts[2m > [22m[2mSessionAPI[2m > [22m[2mError Handling[2m > [22m[2mshould handle session manager errors
[22m[39mError starting session: Error: Database connection failed
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/unit/session-api.test.ts:410:67
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/unit/session-api.test.ts[2m > [22m[2mSessionAPI[2m > [22m[2mError Handling[2m > [22m[2mshould handle billing service errors
[22m[39mError getting session status: Error: Billing service unavailable
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/unit/session-api.test.ts:425:71
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/unit/message-delivery.test.ts[2m > [22m[2mMessageDeliveryService[2m > [22m[2mReal-time Message Delivery[2m > [22m[2mshould validate message before sending
[22m[39mFailed to send message: Error: Invalid message data
    at MessageDeliveryService.validateMessage [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mserver/message-delivery.ts:340:13[90m)[39m
    at MessageDeliveryService.sendMessage [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mserver/message-delivery.ts:70:12[90m)[39m
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/unit/message-delivery.test.ts:131:51
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m

[90mstderr[2m | tests/unit/billing-service.test.ts[2m > [22m[2mBillingService[2m > [22m[2mPayment Processing[2m > [22m[2mshould handle payment failures
[22m[39mError processing payment: Error: Payment gateway error
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/unit/billing-service.test.ts:163:55
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/unit/billing-service.test.ts[2m > [22m[2mBillingService[2m > [22m[2mError Handling[2m > [22m[2mshould handle database errors gracefully
[22m[39mError calculating session cost: Error: Database connection failed
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/unit/billing-service.test.ts:363:45
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/unit/billing-service.test.ts[2m > [22m[2mBillingService[2m > [22m[2mError Handling[2m > [22m[2mshould validate billing data
[22m[39mError calculating session cost: Error: Invalid billing data
    at BillingService.validateBillingData [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mserver/billing-service.ts:387:13[90m)[39m
    at BillingService.calculateSessionCost [90m(/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mserver/billing-service.ts:94:12[90m)[39m
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/unit/billing-service.test.ts:377:35
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m

[90mstderr[2m | tests/unit/billing-service.test.ts[2m > [22m[2mBillingService[2m > [22m[2mError Handling[2m > [22m[2mshould handle concurrent payment processing
[22m[39mError processing payment: Error: Concurrent modification
    at [90m/Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mtests/unit/billing-service.test.ts:390:55
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:155:11
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:752:26
    at [90mfile:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1863:10[90m)[39m
    at runTest [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1574:12[90m)[39m
[90m    at processTicksAndRejections (node:internal/process/task_queues:105:5)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m
    at runSuite [90m(file:///Users/rohan_rajah/Documents/Code/src/Angelguidesver10/[39mnode_modules/[4m@vitest[24m/runner/dist/chunk-hooks.js:1729:8[90m)[39m

[90mstderr[2m | tests/e2e/call-flows.test.ts[2m > [22m[2mE2E Call Flows[2m > [22m[2mError Scenarios[2m > [22m[2mshould handle signaling to non-existent session
[22m[39mNo target user found for offer in session 99999

[90mstderr[2m | tests/unit/signaling-service.test.ts[2m > [22m[2mSignalingService[2m > [22m[2mOffer Handling[2m > [22m[2mshould not send offer if target user not found
[22m[39mNo target user found for offer in session 789

