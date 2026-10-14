import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacySubscriptionSlot } from "./legacy-subscription-slot.js";

test("LegacySubscriptionSlot starts in idle", () => {
  const item = newLegacySubscriptionSlot("code-363", "label-197");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacySubscriptionSlot moves to ready", () => {
  const item = newLegacySubscriptionSlot("code-363", "label-197");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LegacySubscriptionSlot rejects moves from stopped", () => {
  const item = newLegacySubscriptionSlot("code-363", "label-197");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
