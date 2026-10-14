import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryBidRuleSchedule } from "./primary-bid-rule-schedule.js";

test("PrimaryBidRuleSchedule starts in proposed", () => {
  const item = newPrimaryBidRuleSchedule("code-365", "name-45");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryBidRuleSchedule moves to rejected", () => {
  const item = newPrimaryBidRuleSchedule("code-365", "name-45");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PrimaryBidRuleSchedule rejects moves from withdrawn", () => {
  const item = newPrimaryBidRuleSchedule("code-365", "name-45");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
