import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingBidRuleNotice } from "./pending-bid-rule-notice.js";

test("PendingBidRuleNotice starts in new", () => {
  const item = newPendingBidRuleNotice("code-111", "title-416");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingBidRuleNotice moves to queued", () => {
  const item = newPendingBidRuleNotice("code-111", "title-416");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PendingBidRuleNotice rejects moves from failed", () => {
  const item = newPendingBidRuleNotice("code-111", "title-416");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
