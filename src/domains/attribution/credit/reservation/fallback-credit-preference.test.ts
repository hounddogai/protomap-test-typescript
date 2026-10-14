import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackCreditPreference } from "./fallback-credit-preference.js";

test("FallbackCreditPreference starts in requested", () => {
  const item = newFallbackCreditPreference("code-991", "name-574");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackCreditPreference moves to expired", () => {
  const item = newFallbackCreditPreference("code-991", "name-574");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("FallbackCreditPreference rejects moves from expired", () => {
  const item = newFallbackCreditPreference("code-991", "name-574");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
