import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRetentionTier } from "./global-retention-tier.js";

test("GlobalRetentionTier starts in requested", () => {
  const item = newGlobalRetentionTier("code-796", "title-794");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRetentionTier moves to expired", () => {
  const item = newGlobalRetentionTier("code-796", "title-794");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("GlobalRetentionTier rejects moves from expired", () => {
  const item = newGlobalRetentionTier("code-796", "title-794");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
