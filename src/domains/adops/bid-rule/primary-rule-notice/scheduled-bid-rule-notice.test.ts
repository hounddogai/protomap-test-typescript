import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledBidRuleNotice } from "./scheduled-bid-rule-notice.js";

test("ScheduledBidRuleNotice starts in open", () => {
  const item = newScheduledBidRuleNotice("code-425", "label-457");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledBidRuleNotice moves to resolved", () => {
  const item = newScheduledBidRuleNotice("code-425", "label-457");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ScheduledBidRuleNotice rejects moves from archived", () => {
  const item = newScheduledBidRuleNotice("code-425", "label-457");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
