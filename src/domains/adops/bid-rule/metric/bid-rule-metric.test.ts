import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleMetric } from "./bid-rule-metric.js";

test("BidRuleMetric starts in created", () => {
  const item = newBidRuleMetric("code-43", "name-308");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleMetric moves to validated", () => {
  const item = newBidRuleMetric("code-43", "name-308");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BidRuleMetric rejects moves from retired", () => {
  const item = newBidRuleMetric("code-43", "name-308");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
