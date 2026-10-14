import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalProofSlot } from "./global-proof-slot.js";

test("GlobalProofSlot starts in proposed", () => {
  const item = newGlobalProofSlot("code-956", "label-139");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalProofSlot moves to approved", () => {
  const item = newGlobalProofSlot("code-956", "label-139");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("GlobalProofSlot rejects moves from withdrawn", () => {
  const item = newGlobalProofSlot("code-956", "label-139");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
