# Test review checklist

Use this when you review someone else's tests (peer review from Session 3) — and your own before you submit.
It grows every session. By Session 6 it is your tool for reviewing AI-generated tests.

How to comment: be specific, point to the line, and suggest the fix. One thing to keep, one thing to improve.

## Session 1 — Tests and locators

- [ ] Each test name describes a **behavior** ("customer can log in"), not a step or a number ("test 1")
- [ ] Every action and assertion has `await`
- [ ] Locators follow the priority: `getByRole` → `getByLabel` → `getByPlaceholder` / `getByText` → `getByTestId` → CSS/XPath only as a last resort, with a comment saying why
- [ ] No locators based on layout or styling (`nth-child`, `.btn-primary`, long CSS paths, absolute XPath)
- [ ] `first()` / `nth()` are used only when order really matters — not to hide a vague locator
- [ ] Each test ends with at least one `expect` that checks the result the user cares about
- [ ] The test follows the manual test case: same steps, same expected result
- [ ] No `test.only`, no `page.pause()`

## Session 2 — Assertions and reliability

- [ ] Assertions are **web-first**: `await expect(locator).toHaveText(…)`, not `expect(await locator.textContent())` or a value read into a variable first
- [ ] No hard waits of any kind: no `waitForTimeout`, no `setTimeout` promise — the test waits for a condition instead
- [ ] Each test checks the **outcome** the user cares about (the page they land on, the number that changed, the data saved) — not just that a click happened or a toast appeared
- [ ] Each test **can fail**: break the feature on purpose (comment out the key action) and the test goes red
- [ ] Every negative check (`toBeHidden`, `not.toBeVisible`, `toHaveCount(0)`) has a positive check proving the locator finds the element when it should
- [ ] No retries, longer timeouts or `test.slow()` added to make a test pass
- [ ] The test sets up its own state — it doesn't rely on another test running first, on a hard-coded record id, or on values that exist only on one machine
- [ ] It passes 20 out of 20 with `--repeat-each=20` and with `--shuffle`

## Session 3 — Structure and isolation

_Added in Session 3._

## Session 4 — Fixtures, auth and mocking

_Added in Session 4._

## Session 5 — API tests

_Added in Session 5._
