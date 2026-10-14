import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationCheckpoint } from "./reputation-checkpoint.js";

test("ReputationCheckpoint starts in created", () => {
  const item = newReputationCheckpoint("code-64", "title-267");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationCheckpoint moves to validated", () => {
  const item = newReputationCheckpoint("code-64", "title-267");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ReputationCheckpoint rejects moves from retired", () => {
  const item = newReputationCheckpoint("code-64", "title-267");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
