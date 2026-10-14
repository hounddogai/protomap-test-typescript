import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleBatch } from "./bid-rule-batch.js";

test("BidRuleBatch starts in created", () => {
  const item = newBidRuleBatch("code-366", "label-723");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleBatch moves to validated", () => {
  const item = newBidRuleBatch("code-366", "label-723");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BidRuleBatch rejects moves from retired", () => {
  const item = newBidRuleBatch("code-366", "label-723");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
