import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyFraudCheckClaim } from "./legacy-fraud-check-claim.js";

test("LegacyFraudCheckClaim starts in new", () => {
  const item = newLegacyFraudCheckClaim("code-568", "label-711");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyFraudCheckClaim moves to running", () => {
  const item = newLegacyFraudCheckClaim("code-568", "label-711");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LegacyFraudCheckClaim rejects moves from failed", () => {
  const item = newLegacyFraudCheckClaim("code-568", "label-711");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
