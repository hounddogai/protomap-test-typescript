import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalBidRuleMilestone } from "./seasonal-bid-rule-milestone.js";

test("SeasonalBidRuleMilestone starts in draft", () => {
  const item = newSeasonalBidRuleMilestone("code-410", "title-416");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalBidRuleMilestone moves to pending", () => {
  const item = newSeasonalBidRuleMilestone("code-410", "title-416");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SeasonalBidRuleMilestone rejects moves from closed", () => {
  const item = newSeasonalBidRuleMilestone("code-410", "title-416");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
