import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySubscriptionSlot } from "./primary-subscription-slot.js";

test("PrimarySubscriptionSlot starts in idle", () => {
  const item = newPrimarySubscriptionSlot("code-922", "title-157");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySubscriptionSlot moves to warming", () => {
  const item = newPrimarySubscriptionSlot("code-922", "title-157");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PrimarySubscriptionSlot rejects moves from stopped", () => {
  const item = newPrimarySubscriptionSlot("code-922", "title-157");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
