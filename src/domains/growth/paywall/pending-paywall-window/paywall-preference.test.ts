import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallPreference } from "./paywall-preference.js";

test("PaywallPreference starts in idle", () => {
  const item = newPaywallPreference("code-610", "title-898");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallPreference moves to draining", () => {
  const item = newPaywallPreference("code-610", "title-898");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("PaywallPreference rejects moves from stopped", () => {
  const item = newPaywallPreference("code-610", "title-898");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
