import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofRecord } from "./proof-record.js";

test("ProofRecord starts in requested", () => {
  const item = newProofRecord("code-531", "label-332");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofRecord moves to expired", () => {
  const item = newProofRecord("code-531", "label-332");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ProofRecord rejects moves from expired", () => {
  const item = newProofRecord("code-531", "label-332");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
