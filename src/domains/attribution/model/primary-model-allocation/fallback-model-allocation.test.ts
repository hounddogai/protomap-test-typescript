import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackModelAllocation } from "./fallback-model-allocation.js";

test("FallbackModelAllocation starts in new", () => {
  const item = newFallbackModelAllocation("code-558", "label-973");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackModelAllocation moves to done", () => {
  const item = newFallbackModelAllocation("code-558", "label-973");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("FallbackModelAllocation rejects moves from failed", () => {
  const item = newFallbackModelAllocation("code-558", "label-973");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
