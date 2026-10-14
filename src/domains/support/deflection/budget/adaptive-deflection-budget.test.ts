import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveDeflectionBudget } from "./adaptive-deflection-budget.js";

test("AdaptiveDeflectionBudget starts in proposed", () => {
  const item = newAdaptiveDeflectionBudget("code-276", "title-208");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveDeflectionBudget moves to approved", () => {
  const item = newAdaptiveDeflectionBudget("code-276", "title-208");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("AdaptiveDeflectionBudget rejects moves from withdrawn", () => {
  const item = newAdaptiveDeflectionBudget("code-276", "title-208");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
