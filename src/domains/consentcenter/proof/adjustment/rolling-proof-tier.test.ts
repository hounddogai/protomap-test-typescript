import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingProofTier } from "./rolling-proof-tier.js";

test("RollingProofTier starts in proposed", () => {
  const item = newRollingProofTier("code-324", "title-247");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingProofTier moves to approved", () => {
  const item = newRollingProofTier("code-324", "title-247");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RollingProofTier rejects moves from withdrawn", () => {
  const item = newRollingProofTier("code-324", "title-247");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
