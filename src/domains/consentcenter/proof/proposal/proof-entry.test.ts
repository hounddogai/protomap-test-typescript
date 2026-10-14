import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofEntry } from "./proof-entry.js";

test("ProofEntry starts in new", () => {
  const item = newProofEntry("code-417", "title-665");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofEntry moves to done", () => {
  const item = newProofEntry("code-417", "title-665");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ProofEntry rejects moves from failed", () => {
  const item = newProofEntry("code-417", "title-665");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
