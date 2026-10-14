import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacySuppressionClaim } from "./legacy-suppression-claim.js";

test("LegacySuppressionClaim starts in draft", () => {
  const item = newLegacySuppressionClaim("code-840", "name-829");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacySuppressionClaim moves to pending", () => {
  const item = newLegacySuppressionClaim("code-840", "name-829");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LegacySuppressionClaim rejects moves from closed", () => {
  const item = newLegacySuppressionClaim("code-840", "name-829");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
