import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionRule } from "./redemption-rule.js";

test("RedemptionRule starts in new", () => {
  const item = newRedemptionRule("code-729", "name-814");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionRule moves to failed", () => {
  const item = newRedemptionRule("code-729", "name-814");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("RedemptionRule rejects moves from failed", () => {
  const item = newRedemptionRule("code-729", "name-814");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
