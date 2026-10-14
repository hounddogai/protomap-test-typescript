import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofOverride } from "./proof-override.js";

test("ProofOverride starts in draft", () => {
  const item = newProofOverride("code-467", "title-106");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofOverride moves to pending", () => {
  const item = newProofOverride("code-467", "title-106");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ProofOverride rejects moves from closed", () => {
  const item = newProofOverride("code-467", "title-106");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
