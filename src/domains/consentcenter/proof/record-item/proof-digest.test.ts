import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofDigest } from "./proof-digest.js";

test("ProofDigest starts in open", () => {
  const item = newProofDigest("code-357", "name-388");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofDigest moves to in review", () => {
  const item = newProofDigest("code-357", "name-388");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ProofDigest rejects moves from archived", () => {
  const item = newProofDigest("code-357", "name-388");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
