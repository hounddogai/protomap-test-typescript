import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryProofCheckpoint } from "./primary-proof-checkpoint.js";

test("PrimaryProofCheckpoint starts in created", () => {
  const item = newPrimaryProofCheckpoint("code-958", "label-26");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryProofCheckpoint moves to validated", () => {
  const item = newPrimaryProofCheckpoint("code-958", "label-26");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PrimaryProofCheckpoint rejects moves from retired", () => {
  const item = newPrimaryProofCheckpoint("code-958", "label-26");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
