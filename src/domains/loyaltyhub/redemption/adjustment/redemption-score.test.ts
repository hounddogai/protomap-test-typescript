import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionScore } from "./redemption-score.js";

test("RedemptionScore starts in planned", () => {
  const item = newRedemptionScore("code-242", "title-97");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionScore moves to in progress", () => {
  const item = newRedemptionScore("code-242", "title-97");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RedemptionScore rejects moves from cancelled", () => {
  const item = newRedemptionScore("code-242", "title-97");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
