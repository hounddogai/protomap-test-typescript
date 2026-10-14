import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySuppressionTier } from "./primary-suppression-tier.js";

test("PrimarySuppressionTier starts in requested", () => {
  const item = newPrimarySuppressionTier("code-791", "title-539");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySuppressionTier moves to revoked", () => {
  const item = newPrimarySuppressionTier("code-791", "title-539");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PrimarySuppressionTier rejects moves from expired", () => {
  const item = newPrimarySuppressionTier("code-791", "title-539");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
