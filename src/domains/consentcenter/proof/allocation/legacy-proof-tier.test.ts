import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyProofTier } from "./legacy-proof-tier.js";

test("LegacyProofTier starts in requested", () => {
  const item = newLegacyProofTier("code-971", "label-819");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyProofTier moves to granted", () => {
  const item = newLegacyProofTier("code-971", "label-819");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LegacyProofTier rejects moves from expired", () => {
  const item = newLegacyProofTier("code-971", "label-819");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
