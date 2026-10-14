import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledBidRuleQuota } from "./scheduled-bid-rule-quota.js";

test("ScheduledBidRuleQuota starts in proposed", () => {
  const item = newScheduledBidRuleQuota("code-542", "name-360");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledBidRuleQuota moves to approved", () => {
  const item = newScheduledBidRuleQuota("code-542", "name-360");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ScheduledBidRuleQuota rejects moves from withdrawn", () => {
  const item = newScheduledBidRuleQuota("code-542", "name-360");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
