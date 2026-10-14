import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofRequest } from "./proof-request.js";

test("ProofRequest starts in draft", () => {
  const item = newProofRequest("code-495", "label-148");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofRequest moves to pending", () => {
  const item = newProofRequest("code-495", "label-148");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ProofRequest rejects moves from closed", () => {
  const item = newProofRequest("code-495", "label-148");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
