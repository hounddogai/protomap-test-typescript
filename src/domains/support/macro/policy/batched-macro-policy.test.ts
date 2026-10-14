import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedMacroPolicy } from "./batched-macro-policy.js";

test("BatchedMacroPolicy starts in open", () => {
  const item = newBatchedMacroPolicy("code-142", "label-522");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedMacroPolicy moves to in review", () => {
  const item = newBatchedMacroPolicy("code-142", "label-522");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BatchedMacroPolicy rejects moves from archived", () => {
  const item = newBatchedMacroPolicy("code-142", "label-522");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
