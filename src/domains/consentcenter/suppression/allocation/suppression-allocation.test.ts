import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionAllocation } from "./suppression-allocation.js";

test("SuppressionAllocation starts in planned", () => {
  const item = newSuppressionAllocation("code-883", "name-357");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionAllocation moves to completed", () => {
  const item = newSuppressionAllocation("code-883", "name-357");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("SuppressionAllocation rejects moves from cancelled", () => {
  const item = newSuppressionAllocation("code-883", "name-357");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
