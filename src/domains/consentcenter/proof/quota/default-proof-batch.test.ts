import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultProofBatch } from "./default-proof-batch.js";

test("DefaultProofBatch starts in created", () => {
  const item = newDefaultProofBatch("code-457", "title-654");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultProofBatch moves to validated", () => {
  const item = newDefaultProofBatch("code-457", "title-654");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DefaultProofBatch rejects moves from retired", () => {
  const item = newDefaultProofBatch("code-457", "title-654");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
