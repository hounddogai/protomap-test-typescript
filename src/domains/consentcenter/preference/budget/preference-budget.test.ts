import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceBudget } from "./preference-budget.js";

test("PreferenceBudget starts in proposed", () => {
  const item = newPreferenceBudget("code-290", "title-787");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceBudget moves to withdrawn", () => {
  const item = newPreferenceBudget("code-290", "title-787");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PreferenceBudget rejects moves from withdrawn", () => {
  const item = newPreferenceBudget("code-290", "title-787");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
