# Testing Guide

## Philosophy
100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence — without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Framework
This project uses **Vitest** (v4.x) and **React Testing Library** for frontend tests.

## Running Tests
Run the following commands to execute the test suite:

```bash
# Run tests once
npm run test

# Run tests in watch/interactive mode
npm run test:watch
```

## Test Layers
- **Unit Tests**: Test individual components, custom React hooks, and utility functions in isolation. Located alongside files with `.test.ts` or `.test.tsx` extensions.
- **Integration Tests**: Verify interactions between components, custom hooks, and stores (such as Zustand).
- **Smoke Tests / E2E**: Basic verification of routing and key pages using mock data or local servers.

## Conventions
- **Naming**: Test files should follow the `{filename}.test.{ts,tsx}` naming convention.
- **Mocking**: Mock external dependencies like Supabase using `vi.mock()` in setup or per test.
- **Assertions**: Use `@testing-library/jest-dom` matchers (e.g. `toBeInTheDocument()`, `toHaveTextContent()`) for DOM elements.
