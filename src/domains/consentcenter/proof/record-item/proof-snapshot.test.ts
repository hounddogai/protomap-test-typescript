import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofSnapshot } from "./proof-snapshot.js";

test("ProofSnapshot starts in open", () => {
  const item = newProofSnapshot("code-380", "title-643");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofSnapshot moves to in review", () => {
  const item = newProofSnapshot("code-380", "title-643");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ProofSnapshot rejects moves from archived", () => {
  const item = newProofSnapshot("code-380", "title-643");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
