import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalFraudCheckClaim } from "./global-fraud-check-claim.js";

test("GlobalFraudCheckClaim starts in new", () => {
  const item = newGlobalFraudCheckClaim("code-700", "title-128");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalFraudCheckClaim moves to done", () => {
  const item = newGlobalFraudCheckClaim("code-700", "title-128");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("GlobalFraudCheckClaim rejects moves from failed", () => {
  const item = newGlobalFraudCheckClaim("code-700", "title-128");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
