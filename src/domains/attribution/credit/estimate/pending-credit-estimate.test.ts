import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCreditEstimate } from "./pending-credit-estimate.js";

test("PendingCreditEstimate starts in new", () => {
  const item = newPendingCreditEstimate("code-355", "label-980");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCreditEstimate moves to done", () => {
  const item = newPendingCreditEstimate("code-355", "label-980");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PendingCreditEstimate rejects moves from failed", () => {
  const item = newPendingCreditEstimate("code-355", "label-980");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
