import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveRetentionPreference } from "./adaptive-retention-preference.js";

test("AdaptiveRetentionPreference starts in requested", () => {
  const item = newAdaptiveRetentionPreference("code-976", "label-466");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveRetentionPreference moves to revoked", () => {
  const item = newAdaptiveRetentionPreference("code-976", "label-466");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("AdaptiveRetentionPreference rejects moves from expired", () => {
  const item = newAdaptiveRetentionPreference("code-976", "label-466");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
