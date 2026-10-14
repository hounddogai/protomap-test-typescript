import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedBidRuleQuota } from "./capped-bid-rule-quota.js";

test("CappedBidRuleQuota starts in new", () => {
  const item = newCappedBidRuleQuota("code-667", "title-571");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedBidRuleQuota moves to running", () => {
  const item = newCappedBidRuleQuota("code-667", "title-571");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("CappedBidRuleQuota rejects moves from failed", () => {
  const item = newCappedBidRuleQuota("code-667", "title-571");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
