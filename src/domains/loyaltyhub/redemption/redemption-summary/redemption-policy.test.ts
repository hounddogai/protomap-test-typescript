import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionPolicy } from "./redemption-policy.js";

test("RedemptionPolicy starts in draft", () => {
  const item = newRedemptionPolicy("code-450", "label-289");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionPolicy moves to active", () => {
  const item = newRedemptionPolicy("code-450", "label-289");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("RedemptionPolicy rejects moves from closed", () => {
  const item = newRedemptionPolicy("code-450", "label-289");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
