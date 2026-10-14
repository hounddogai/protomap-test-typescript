import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckPreference } from "./fraud-check-preference.js";

test("FraudCheckPreference starts in draft", () => {
  const item = newFraudCheckPreference("code-549", "name-433");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckPreference moves to active", () => {
  const item = newFraudCheckPreference("code-549", "name-433");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("FraudCheckPreference rejects moves from closed", () => {
  const item = newFraudCheckPreference("code-549", "name-433");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
