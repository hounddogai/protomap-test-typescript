import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofDraft } from "./proof-draft.js";

test("ProofDraft starts in new", () => {
  const item = newProofDraft("code-74", "name-482");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofDraft moves to running", () => {
  const item = newProofDraft("code-74", "name-482");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("ProofDraft rejects moves from failed", () => {
  const item = newProofDraft("code-74", "name-482");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
