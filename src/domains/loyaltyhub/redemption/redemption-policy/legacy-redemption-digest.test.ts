import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyRedemptionDigest } from "./legacy-redemption-digest.js";

test("LegacyRedemptionDigest starts in new", () => {
  const item = newLegacyRedemptionDigest("code-306", "label-678");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyRedemptionDigest moves to failed", () => {
  const item = newLegacyRedemptionDigest("code-306", "label-678");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("LegacyRedemptionDigest rejects moves from failed", () => {
  const item = newLegacyRedemptionDigest("code-306", "label-678");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
