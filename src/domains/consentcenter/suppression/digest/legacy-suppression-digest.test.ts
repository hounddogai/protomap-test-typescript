import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacySuppressionDigest } from "./legacy-suppression-digest.js";

test("LegacySuppressionDigest starts in requested", () => {
  const item = newLegacySuppressionDigest("code-326", "label-531");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacySuppressionDigest moves to expired", () => {
  const item = newLegacySuppressionDigest("code-326", "label-531");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("LegacySuppressionDigest rejects moves from expired", () => {
  const item = newLegacySuppressionDigest("code-326", "label-531");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
