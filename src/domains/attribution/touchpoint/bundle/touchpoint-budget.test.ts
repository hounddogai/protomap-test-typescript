import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointBudget } from "./touchpoint-budget.js";

test("TouchpointBudget starts in proposed", () => {
  const item = newTouchpointBudget("code-621", "label-280");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointBudget moves to approved", () => {
  const item = newTouchpointBudget("code-621", "label-280");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TouchpointBudget rejects moves from withdrawn", () => {
  const item = newTouchpointBudget("code-621", "label-280");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
