import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofMilestone } from "./proof-milestone.js";

test("ProofMilestone starts in draft", () => {
  const item = newProofMilestone("code-194", "name-276");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofMilestone moves to closed", () => {
  const item = newProofMilestone("code-194", "name-276");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("ProofMilestone rejects moves from closed", () => {
  const item = newProofMilestone("code-194", "name-276");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
