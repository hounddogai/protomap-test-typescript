import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutAllocation } from "./opt-out-allocation.js";

test("OptOutAllocation starts in draft", () => {
  const item = newOptOutAllocation("code-971", "label-585");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutAllocation moves to pending", () => {
  const item = newOptOutAllocation("code-971", "label-585");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("OptOutAllocation rejects moves from closed", () => {
  const item = newOptOutAllocation("code-971", "label-585");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
