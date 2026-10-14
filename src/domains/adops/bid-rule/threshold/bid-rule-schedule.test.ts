import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleSchedule } from "./bid-rule-schedule.js";

test("BidRuleSchedule starts in idle", () => {
  const item = newBidRuleSchedule("code-881", "title-59");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleSchedule moves to ready", () => {
  const item = newBidRuleSchedule("code-881", "title-59");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("BidRuleSchedule rejects moves from stopped", () => {
  const item = newBidRuleSchedule("code-881", "title-59");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
