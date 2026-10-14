import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientBidRuleMetric } from "./lenient-bid-rule-metric.js";

test("LenientBidRuleMetric starts in proposed", () => {
  const item = newLenientBidRuleMetric("code-678", "name-417");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientBidRuleMetric moves to approved", () => {
  const item = newLenientBidRuleMetric("code-678", "name-417");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientBidRuleMetric rejects moves from withdrawn", () => {
  const item = newLenientBidRuleMetric("code-678", "name-417");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
