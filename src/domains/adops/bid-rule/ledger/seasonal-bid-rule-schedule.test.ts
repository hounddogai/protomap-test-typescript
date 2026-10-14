import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalBidRuleSchedule } from "./seasonal-bid-rule-schedule.js";

test("SeasonalBidRuleSchedule starts in draft", () => {
  const item = newSeasonalBidRuleSchedule("code-682", "name-66");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalBidRuleSchedule moves to pending", () => {
  const item = newSeasonalBidRuleSchedule("code-682", "name-66");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SeasonalBidRuleSchedule rejects moves from closed", () => {
  const item = newSeasonalBidRuleSchedule("code-682", "name-66");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
