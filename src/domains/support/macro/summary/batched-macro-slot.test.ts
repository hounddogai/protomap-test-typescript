import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedMacroSlot } from "./batched-macro-slot.js";

test("BatchedMacroSlot starts in draft", () => {
  const item = newBatchedMacroSlot("code-853", "name-831");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedMacroSlot moves to active", () => {
  const item = newBatchedMacroSlot("code-853", "name-831");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("BatchedMacroSlot rejects moves from closed", () => {
  const item = newBatchedMacroSlot("code-853", "name-831");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
