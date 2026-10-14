import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualProofTier } from "./manual-proof-tier.js";

test("ManualProofTier starts in draft", () => {
  const item = newManualProofTier("code-25", "title-115");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualProofTier moves to active", () => {
  const item = newManualProofTier("code-25", "title-115");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ManualProofTier rejects moves from closed", () => {
  const item = newManualProofTier("code-25", "title-115");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
