import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionPreference } from "./subscription-preference.js";

test("SubscriptionPreference starts in idle", () => {
  const item = newSubscriptionPreference("code-211", "name-968");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionPreference moves to draining", () => {
  const item = newSubscriptionPreference("code-211", "name-968");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("SubscriptionPreference rejects moves from stopped", () => {
  const item = newSubscriptionPreference("code-211", "name-968");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
