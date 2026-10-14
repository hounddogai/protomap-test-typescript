import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredFraudCheckPreference } from "./tiered-fraud-check-preference.js";

test("TieredFraudCheckPreference starts in open", () => {
  const item = newTieredFraudCheckPreference("code-496", "name-155");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredFraudCheckPreference moves to in review", () => {
  const item = newTieredFraudCheckPreference("code-496", "name-155");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("TieredFraudCheckPreference rejects moves from archived", () => {
  const item = newTieredFraudCheckPreference("code-496", "name-155");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
