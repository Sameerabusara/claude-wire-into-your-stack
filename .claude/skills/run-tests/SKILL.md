# run-tests

Run and format the project test suite with detailed output.

## Scope

Fires when the user asks to "run tests", "test", "check tests", or similar requests for test execution.

## When to use

Call this skill to:
- Execute the test suite and report results
- Verify changes don't break existing tests
- Debug failing tests with full output
- Check test coverage in the project

## How it works

Runs `npm test` and formats the output with:
- Clear pass/fail indicators
- Individual test results
- Error messages for failures
- Execution time and summary stats

## Implementation

The skill uses the MCP server's `run_script` tool to execute tests, capturing stdout/stderr and providing a formatted report to Claude for analysis.

## Example usage

```
/run-tests
```

Or in conversation:
```
"run the tests and show me any failures"
"can you check if my changes break tests?"
```
