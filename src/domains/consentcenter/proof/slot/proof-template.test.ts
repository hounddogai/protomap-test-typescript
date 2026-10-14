import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofTemplate } from "./proof-template.js";

test("ProofTemplate starts in created", () => {
  const item = newProofTemplate("code-430", "title-678");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofTemplate moves to retired", () => {
  const item = newProofTemplate("code-430", "title-678");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("ProofTemplate rejects moves from retired", () => {
  const item = newProofTemplate("code-430", "title-678");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
