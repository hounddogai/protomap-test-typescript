import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutPreference } from "./payout-preference.js";

test("PayoutPreference starts in open", () => {
  const item = newPayoutPreference("code-672", "title-694");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutPreference moves to resolved", () => {
  const item = newPayoutPreference("code-672", "title-694");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("PayoutPreference rejects moves from archived", () => {
  const item = newPayoutPreference("code-672", "title-694");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
