import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedBidRuleOverride } from "./capped-bid-rule-override.js";

test("CappedBidRuleOverride starts in created", () => {
  const item = newCappedBidRuleOverride("code-638", "name-506");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedBidRuleOverride moves to validated", () => {
  const item = newCappedBidRuleOverride("code-638", "name-506");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CappedBidRuleOverride rejects moves from retired", () => {
  const item = newCappedBidRuleOverride("code-638", "name-506");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
