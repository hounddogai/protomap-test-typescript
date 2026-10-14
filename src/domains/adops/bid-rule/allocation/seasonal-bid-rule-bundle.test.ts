import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalBidRuleBundle } from "./seasonal-bid-rule-bundle.js";

test("SeasonalBidRuleBundle starts in draft", () => {
  const item = newSeasonalBidRuleBundle("code-999", "name-635");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalBidRuleBundle moves to pending", () => {
  const item = newSeasonalBidRuleBundle("code-999", "name-635");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SeasonalBidRuleBundle rejects moves from closed", () => {
  const item = newSeasonalBidRuleBundle("code-999", "name-635");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
