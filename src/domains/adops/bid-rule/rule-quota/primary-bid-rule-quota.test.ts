import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryBidRuleQuota } from "./primary-bid-rule-quota.js";

test("PrimaryBidRuleQuota starts in proposed", () => {
  const item = newPrimaryBidRuleQuota("code-290", "title-846");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryBidRuleQuota moves to approved", () => {
  const item = newPrimaryBidRuleQuota("code-290", "title-846");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryBidRuleQuota rejects moves from withdrawn", () => {
  const item = newPrimaryBidRuleQuota("code-290", "title-846");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
