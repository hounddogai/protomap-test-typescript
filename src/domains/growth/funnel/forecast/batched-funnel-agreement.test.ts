import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFunnelAgreement } from "./batched-funnel-agreement.js";

test("BatchedFunnelAgreement starts in new", () => {
  const item = newBatchedFunnelAgreement("code-875", "title-412");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFunnelAgreement moves to failed", () => {
  const item = newBatchedFunnelAgreement("code-875", "title-412");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("BatchedFunnelAgreement rejects moves from failed", () => {
  const item = newBatchedFunnelAgreement("code-875", "title-412");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
