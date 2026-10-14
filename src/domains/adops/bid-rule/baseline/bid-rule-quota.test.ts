import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleQuota } from "./bid-rule-quota.js";

test("BidRuleQuota starts in idle", () => {
  const item = newBidRuleQuota("code-892", "title-492");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleQuota moves to ready", () => {
  const item = newBidRuleQuota("code-892", "title-492");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("BidRuleQuota rejects moves from stopped", () => {
  const item = newBidRuleQuota("code-892", "title-492");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
