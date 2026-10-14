import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationAllocation } from "./activation-allocation.js";

test("ActivationAllocation starts in new", () => {
  const item = newActivationAllocation("code-683", "label-415");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationAllocation moves to queued", () => {
  const item = newActivationAllocation("code-683", "label-415");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ActivationAllocation rejects moves from failed", () => {
  const item = newActivationAllocation("code-683", "label-415");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
