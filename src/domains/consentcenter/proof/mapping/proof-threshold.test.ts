import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofThreshold } from "./proof-threshold.js";

test("ProofThreshold starts in open", () => {
  const item = newProofThreshold("code-825", "label-840");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofThreshold moves to reopened", () => {
  const item = newProofThreshold("code-825", "label-840");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("ProofThreshold rejects moves from archived", () => {
  const item = newProofThreshold("code-825", "label-840");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
