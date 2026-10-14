import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleBaseline } from "./bid-rule-baseline.js";

test("BidRuleBaseline starts in new", () => {
  const item = newBidRuleBaseline("code-302", "name-896");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleBaseline moves to queued", () => {
  const item = newBidRuleBaseline("code-302", "name-896");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("BidRuleBaseline rejects moves from failed", () => {
  const item = newBidRuleBaseline("code-302", "name-896");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
