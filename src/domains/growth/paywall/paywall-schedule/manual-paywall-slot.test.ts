import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPaywallSlot } from "./manual-paywall-slot.js";

test("ManualPaywallSlot starts in proposed", () => {
  const item = newManualPaywallSlot("code-496", "title-377");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPaywallSlot moves to approved", () => {
  const item = newManualPaywallSlot("code-496", "title-377");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ManualPaywallSlot rejects moves from withdrawn", () => {
  const item = newManualPaywallSlot("code-496", "title-377");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
