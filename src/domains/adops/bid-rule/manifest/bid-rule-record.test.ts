import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleRecord } from "./bid-rule-record.js";

test("BidRuleRecord starts in requested", () => {
  const item = newBidRuleRecord("code-50", "title-78");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleRecord moves to granted", () => {
  const item = newBidRuleRecord("code-50", "title-78");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BidRuleRecord rejects moves from expired", () => {
  const item = newBidRuleRecord("code-50", "title-78");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
