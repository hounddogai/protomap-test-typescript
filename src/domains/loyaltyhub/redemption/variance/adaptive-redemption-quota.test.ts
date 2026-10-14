import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveRedemptionQuota } from "./adaptive-redemption-quota.js";

test("AdaptiveRedemptionQuota starts in draft", () => {
  const item = newAdaptiveRedemptionQuota("code-684", "label-790");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveRedemptionQuota moves to active", () => {
  const item = newAdaptiveRedemptionQuota("code-684", "label-790");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("AdaptiveRedemptionQuota rejects moves from closed", () => {
  const item = newAdaptiveRedemptionQuota("code-684", "label-790");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
