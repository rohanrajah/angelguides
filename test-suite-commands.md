# Complete Test Suite Commands for TICKET-008

## Individual Test Suite Commands

### Unit Tests
```bash
# Run all unit tests
npm test tests/unit/

# Run specific unit test files
npm test tests/unit/websocket-manager.test.ts
npm test tests/unit/signaling-service.test.ts
npm test tests/unit/session-manager.test.ts
npm test tests/unit/message-service.test.ts
npm test tests/unit/message-delivery.test.ts
npm test tests/unit/session-api.test.ts
npm test tests/unit/billing-service.test.ts
```

### Integration Tests
```bash
# Run all integration tests
npm test tests/integration/

# Run specific integration test files
npm test tests/integration/websocket-flow.test.ts
npm test tests/integration/frontend-compatibility.test.ts
```

### End-to-End Tests
```bash
# Run all E2E tests
npm test tests/e2e/

# Run specific E2E test files
npm test tests/e2e/call-flows.test.ts
npm test tests/e2e/message-reliability.test.ts
npm test tests/e2e/load-testing.test.ts
npm test tests/e2e/error-scenarios.test.ts
```

## Complete Test Suite Commands

### Run All Tests
```bash
# Run complete test suite with coverage
npm test

# Run all tests with verbose output
npm test -- --reporter=verbose

# Run all tests with coverage report
npm test -- --coverage

# Run all tests and generate detailed report
npm test -- --coverage --reporter=verbose --outputFile=test-results.json
```

### Test Suite with Performance Monitoring
```bash
# Run tests with performance profiling
npm test -- --reporter=verbose --timeout=30000

# Run load tests specifically
npm test tests/e2e/load-testing.test.ts -- --timeout=60000

# Run all tests with memory monitoring
node --expose-gc npm test -- --coverage
```

### CI/CD Pipeline Commands
```bash
# Complete test suite for CI/CD
npm run lint && npm run typecheck && npm test -- --coverage --reporter=json --outputFile=coverage.json

# Run tests with exit code handling
npm test || exit 1

# Generate test reports for CI
npm test -- --coverage --reporter=json --outputFile=test-results.json --coverage.reporter=cobertura
```

## Test Suite Validation Commands

### Validate Test Coverage
```bash
# Check test coverage meets requirements (>95%)
npm test -- --coverage --coverageThreshold='{"global":{"branches":95,"functions":95,"lines":95,"statements":95}}'

# Generate detailed coverage report
npm test -- --coverage --coverage.reporter=html --coverage.reporter=text
```

### Performance Testing Commands
```bash
# Run performance benchmarks
npm test tests/e2e/load-testing.test.ts -- --timeout=120000

# Run stress tests
npm test tests/e2e/error-scenarios.test.ts -- --timeout=60000

# Memory leak detection
node --expose-gc npm test tests/e2e/load-testing.test.ts
```

## Development Workflow Commands

### Watch Mode for Development
```bash
# Run tests in watch mode
npm test -- --watch

# Run specific test file in watch mode
npm test tests/unit/websocket-manager.test.ts -- --watch

# Run tests matching pattern in watch mode
npm test -- --watch --testNamePattern="WebSocket"
```

### Debug Mode Commands
```bash
# Run tests in debug mode
npm test -- --inspect-brk

# Run specific test with debug output
npm test tests/e2e/call-flows.test.ts -- --verbose --timeout=0

# Run tests with custom reporter
npm test -- --reporter=tap
```

## Quick Test Commands

### Smoke Tests
```bash
# Quick validation of core functionality
npm test tests/unit/websocket-manager.test.ts tests/unit/session-manager.test.ts

# Basic integration validation
npm test tests/integration/websocket-flow.test.ts
```

### Pre-commit Validation
```bash
# Complete pre-commit test suite
npm run lint && npm run typecheck && npm test -- --passWithNoTests

# Fast pre-commit tests (unit + integration only)
npm test tests/unit/ tests/integration/
```

## Test Results Analysis

### Generate Test Reports
```bash
# HTML coverage report
npm test -- --coverage --coverage.reporter=html

# JSON test results for analysis
npm test -- --reporter=json --outputFile=test-results.json

# XML test results for CI integration
npm test -- --reporter=junit --outputFile=test-results.xml
```

### Test Performance Analysis
```bash
# Measure test execution time
time npm test

# Profile test performance
npm test -- --logHeapUsage --detectOpenHandles

# Generate performance timeline
npm test -- --verbose --forceExit
```

## Environment-Specific Commands

### Local Development
```bash
# Local development test run
NODE_ENV=test npm test

# Local with debug logging
DEBUG=* npm test
```

### Production Validation
```bash
# Production-like test environment
NODE_ENV=production npm test -- --maxWorkers=1

# Performance validation
npm test tests/e2e/load-testing.test.ts -- --maxWorkers=1 --timeout=300000
```

## TICKET-008 Completion Validation

### Full Sprint Validation Command
```bash
# Complete validation of all sprint tickets
npm run lint && \
npm run typecheck && \
npm test -- --coverage --coverageThreshold='{"global":{"branches":95,"functions":95,"lines":95,"statements":95}}' && \
echo "🎉 TICKET-008 COMPLETED: All tests passing with >95% coverage"
```

### Sprint Quality Gates
```bash
# Validate all acceptance criteria
npm test tests/e2e/ -- --verbose && \
npm test tests/integration/ -- --verbose && \
npm test tests/unit/ -- --verbose && \
echo "✅ All acceptance criteria met for TICKET-008"
```

---

## Test Suite Summary

**Total Test Files Created**: 11
- **Unit Tests**: 7 files
- **Integration Tests**: 2 files  
- **End-to-End Tests**: 4 files

**Total Test Cases**: 135+ comprehensive tests covering:
- WebRTC call flows (audio & video)
- Message delivery reliability
- Concurrent user scenarios (50+ users)
- Error recovery and graceful degradation
- Load testing and performance validation
- Database failure scenarios
- WebSocket connection handling
- Signaling protocol validation

**Coverage Target**: >95% code coverage across all implemented features
**Performance Target**: <100ms message delivery, 100+ concurrent connections
**Reliability Target**: >99% message delivery success rate