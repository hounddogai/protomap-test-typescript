import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionPreference } from "./redemption-preference.js";

test("RedemptionPreference starts in draft", () => {
  const item = newRedemptionPreference("code-263", "title-123");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionPreference moves to pending", () => {
  const item = newRedemptionPreference("code-263", "title-123");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RedemptionPreference rejects moves from closed", () => {
  const item = newRedemptionPreference("code-263", "title-123");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
