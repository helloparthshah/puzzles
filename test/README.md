# Testing Framework

This project uses Vitest as the testing framework, which is fast, modern, and works well with ES modules and Next.js.

## Setup

The testing framework is configured with:

- **Vitest**: Main testing framework
- **@testing-library/react**: For testing React components and hooks
- **@testing-library/jest-dom**: Additional matchers for DOM testing
- **jsdom**: Browser environment simulation
- **@vitest/coverage-v8**: Code coverage reporting

## Configuration

- `vitest.config.mjs`: Main configuration file
- `test/setup.js`: Global test setup and mocks
- `test/mocks/`: Next.js specific mocks

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are organized in the `test/` directory, mirroring the source structure:

```
test/
├── setup.js                    # Global test setup
├── mocks/                      # Mock implementations
├── example.test.js             # Framework example
├── hooks/
│   └── useProgress.test.js     # Hook tests
└── utils/
    ├── progressService.test.js # Service tests
    └── progressDataModels.test.js # Data model tests

Source files:
hooks/useProgress.js
utils/progressService.js
utils/progressDataModels.js
```

## Writing Tests

### Basic Test Structure

```javascript
import { describe, test, expect } from 'vitest';

describe('Component/Function Name', () => {
  test('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

### Testing React Hooks

```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

test('should test hook behavior', async () => {
  const { result } = renderHook(() => useMyHook());
  
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
});
```

### Mocking

```javascript
import { vi } from 'vitest';

// Mock a module
vi.mock('../utils/service.js', () => ({
  default: {
    method: vi.fn(),
  },
}));

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue('test');
```

## Available Mocks

### localStorage
Automatically mocked in `test/setup.js` with:
- `getItem()`
- `setItem()`
- `removeItem()`
- `clear()`

### Next.js Navigation
Mocked in `test/mocks/next-navigation.js`:
- `useRouter()`
- `usePathname()`
- `useSearchParams()`
- `useParams()`

### Window APIs
Mocked in `test/setup.js`:
- `addEventListener()`
- `removeEventListener()`
- `dispatchEvent()`
- `StorageEvent`

## Coverage

Coverage reports are generated in the `coverage/` directory and include:
- Text output in terminal
- JSON report for CI/CD
- HTML report for detailed viewing

## CI/CD

GitHub Actions workflow is configured in `.github/workflows/test.yml` to:
- Run tests on Node.js 18.x and 20.x
- Generate coverage reports
- Upload coverage to Codecov

## Best Practices

1. **Test file naming**: Use `.test.js` or `.spec.js` suffix
2. **Descriptive test names**: Use "should" statements
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock external dependencies**: Keep tests isolated
5. **Test behavior, not implementation**: Focus on what the code does
6. **Use async/await**: For testing async operations
7. **Clean up**: Reset mocks between tests