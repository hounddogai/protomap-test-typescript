import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedMacroScore } from "./batched-macro-score.js";

test("BatchedMacroScore starts in planned", () => {
  const item = newBatchedMacroScore("code-702", "name-673");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedMacroScore moves to in progress", () => {
  const item = newBatchedMacroScore("code-702", "name-673");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("BatchedMacroScore rejects moves from cancelled", () => {
  const item = newBatchedMacroScore("code-702", "name-673");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
