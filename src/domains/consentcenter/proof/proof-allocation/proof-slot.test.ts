import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofSlot } from "./proof-slot.js";

test("ProofSlot starts in planned", () => {
  const item = newProofSlot("code-373", "title-715");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofSlot moves to in progress", () => {
  const item = newProofSlot("code-373", "title-715");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ProofSlot rejects moves from cancelled", () => {
  const item = newProofSlot("code-373", "title-715");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
