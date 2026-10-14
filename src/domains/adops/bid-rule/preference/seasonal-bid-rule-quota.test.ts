import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalBidRuleQuota } from "./seasonal-bid-rule-quota.js";

test("SeasonalBidRuleQuota starts in proposed", () => {
  const item = newSeasonalBidRuleQuota("code-773", "title-527");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalBidRuleQuota moves to approved", () => {
  const item = newSeasonalBidRuleQuota("code-773", "title-527");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("SeasonalBidRuleQuota rejects moves from withdrawn", () => {
  const item = newSeasonalBidRuleQuota("code-773", "title-527");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
