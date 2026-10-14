import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledOptOutAllocation } from "./scheduled-opt-out-allocation.js";

test("ScheduledOptOutAllocation starts in new", () => {
  const item = newScheduledOptOutAllocation("code-859", "title-873");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledOptOutAllocation moves to queued", () => {
  const item = newScheduledOptOutAllocation("code-859", "title-873");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ScheduledOptOutAllocation rejects moves from failed", () => {
  const item = newScheduledOptOutAllocation("code-859", "title-873");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
