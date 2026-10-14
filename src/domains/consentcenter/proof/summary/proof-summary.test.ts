import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofSummary } from "./proof-summary.js";

test("ProofSummary starts in draft", () => {
  const item = newProofSummary("code-350", "name-32");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofSummary moves to pending", () => {
  const item = newProofSummary("code-350", "name-32");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ProofSummary rejects moves from closed", () => {
  const item = newProofSummary("code-350", "name-32");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
