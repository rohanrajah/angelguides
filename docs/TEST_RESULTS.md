
> rest-express@1.0.0 test
> vitest --coverage


 RUN  v3.2.4 /Users/rohan_rajah/Documents/Code/src/Angelguidesver10
      Coverage enabled with v8

stderr | tests/unit/session-api.test.ts > SessionAPI > Session Creation > should handle advisor unavailability
Error starting session: Error: Advisor not available
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

stderr | tests/unit/session-api.test.ts > SessionAPI > Session Status Management > should handle non-existent session
Error getting session status: Error: Session not found
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

stderr | tests/unit/session-api.test.ts > SessionAPI > Session Participation > should handle leaving non-existent session
Error leaving session: Error: User not in session
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

stdout | tests/unit/session-manager.test.ts > SessionManager > Session Creation > should create new session with correct properties
Created session 3025 between user 123 and advisor 456

stdout | tests/unit/message-delivery.test.ts > MessageDeliveryService > Real-time Message Delivery > should deliver message in real-time via WebSocket
Queued message for offline user 456. Queue size: 1

stderr | tests/unit/session-api.test.ts > SessionAPI > Session Notes Management > should validate notes permissions
Error updating session notes: Error: Unauthorized to update session notes
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

stderr | tests/unit/session-api.test.ts > SessionAPI > Session Notes Management > should prevent notes update on active sessions
Error updating session notes: Error: Cannot update notes on active session
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

stdout | tests/e2e/message-reliability.test.ts > E2E Message Reliability > Real-time Message Delivery > should deliver message immediately to online recipient
User 123 connected via WebSocket
User 456 connected via WebSocket

stdout | tests/unit/message-delivery.test.ts > MessageDeliveryService > Real-time Message Delivery > should handle offline message queuing
Queued message for offline user 456. Queue size: 1

stderr | tests/unit/session-api.test.ts > SessionAPI > Error Handling > should handle session manager errors
Error starting session: Error: Database connection failed
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

stderr | tests/unit/session-api.test.ts > SessionAPI > Error Handling > should handle billing service errors
