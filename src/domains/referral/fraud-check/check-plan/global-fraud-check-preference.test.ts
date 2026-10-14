import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalFraudCheckPreference } from "./global-fraud-check-preference.js";

test("GlobalFraudCheckPreference starts in idle", () => {
  const item = newGlobalFraudCheckPreference("code-211", "name-556");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalFraudCheckPreference moves to warming", () => {
  const item = newGlobalFraudCheckPreference("code-211", "name-556");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("GlobalFraudCheckPreference rejects moves from stopped", () => {
  const item = newGlobalFraudCheckPreference("code-211", "name-556");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
