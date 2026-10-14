import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalBounceBudget } from "./regional-bounce-budget.js";

test("RegionalBounceBudget starts in planned", () => {
  const item = newRegionalBounceBudget("code-952", "label-138");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalBounceBudget moves to scheduled", () => {
  const item = newRegionalBounceBudget("code-952", "label-138");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RegionalBounceBudget rejects moves from cancelled", () => {
  const item = newRegionalBounceBudget("code-952", "label-138");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
