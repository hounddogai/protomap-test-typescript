import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingBidRuleAudit } from "./rolling-bid-rule-audit.js";

test("RollingBidRuleAudit starts in proposed", () => {
  const item = newRollingBidRuleAudit("code-351", "label-619");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingBidRuleAudit moves to approved", () => {
  const item = newRollingBidRuleAudit("code-351", "label-619");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RollingBidRuleAudit rejects moves from withdrawn", () => {
  const item = newRollingBidRuleAudit("code-351", "label-619");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
