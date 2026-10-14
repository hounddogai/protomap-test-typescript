import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackActivationAllocation } from "./fallback-activation-allocation.js";

test("FallbackActivationAllocation starts in new", () => {
  const item = newFallbackActivationAllocation("code-429", "title-586");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackActivationAllocation moves to running", () => {
  const item = newFallbackActivationAllocation("code-429", "title-586");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("FallbackActivationAllocation rejects moves from failed", () => {
  const item = newFallbackActivationAllocation("code-429", "title-586");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
