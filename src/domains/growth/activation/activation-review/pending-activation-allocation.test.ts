import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingActivationAllocation } from "./pending-activation-allocation.js";

test("PendingActivationAllocation starts in open", () => {
  const item = newPendingActivationAllocation("code-630", "title-328");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingActivationAllocation moves to reopened", () => {
  const item = newPendingActivationAllocation("code-630", "title-328");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("PendingActivationAllocation rejects moves from archived", () => {
  const item = newPendingActivationAllocation("code-630", "title-328");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
