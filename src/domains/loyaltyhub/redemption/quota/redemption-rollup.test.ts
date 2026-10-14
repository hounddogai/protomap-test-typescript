import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionRollup } from "./redemption-rollup.js";

test("RedemptionRollup starts in open", () => {
  const item = newRedemptionRollup("code-542", "label-743");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionRollup moves to in review", () => {
  const item = newRedemptionRollup("code-542", "label-743");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RedemptionRollup rejects moves from archived", () => {
  const item = newRedemptionRollup("code-542", "label-743");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
