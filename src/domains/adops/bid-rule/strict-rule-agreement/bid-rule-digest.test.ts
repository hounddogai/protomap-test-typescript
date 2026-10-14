import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleDigest } from "./bid-rule-digest.js";

test("BidRuleDigest starts in draft", () => {
  const item = newBidRuleDigest("code-203", "title-769");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleDigest moves to pending", () => {
  const item = newBidRuleDigest("code-203", "title-769");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BidRuleDigest rejects moves from closed", () => {
  const item = newBidRuleDigest("code-203", "title-769");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
