import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientProofThreshold } from "./lenient-proof-threshold.js";

test("LenientProofThreshold starts in created", () => {
  const item = newLenientProofThreshold("code-981", "title-444");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientProofThreshold moves to validated", () => {
  const item = newLenientProofThreshold("code-981", "title-444");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LenientProofThreshold rejects moves from retired", () => {
  const item = newLenientProofThreshold("code-981", "title-444");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
