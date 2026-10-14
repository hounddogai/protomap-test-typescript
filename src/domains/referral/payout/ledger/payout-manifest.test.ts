import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutManifest } from "./payout-manifest.js";

test("PayoutManifest starts in draft", () => {
  const item = newPayoutManifest("code-55", "label-145");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutManifest moves to active", () => {
  const item = newPayoutManifest("code-55", "label-145");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PayoutManifest rejects moves from closed", () => {
  const item = newPayoutManifest("code-55", "label-145");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
