import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPaywallDigest } from "./lenient-paywall-digest.js";

test("LenientPaywallDigest starts in planned", () => {
  const item = newLenientPaywallDigest("code-812", "label-902");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPaywallDigest moves to in progress", () => {
  const item = newLenientPaywallDigest("code-812", "label-902");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("LenientPaywallDigest rejects moves from cancelled", () => {
  const item = newLenientPaywallDigest("code-812", "label-902");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
