import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultOptOutAllocation } from "./default-opt-out-allocation.js";

test("DefaultOptOutAllocation starts in open", () => {
  const item = newDefaultOptOutAllocation("code-803", "label-663");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultOptOutAllocation moves to resolved", () => {
  const item = newDefaultOptOutAllocation("code-803", "label-663");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("DefaultOptOutAllocation rejects moves from archived", () => {
  const item = newDefaultOptOutAllocation("code-803", "label-663");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
