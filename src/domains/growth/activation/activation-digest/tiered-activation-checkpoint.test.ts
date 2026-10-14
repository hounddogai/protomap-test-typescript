import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredActivationCheckpoint } from "./tiered-activation-checkpoint.js";

test("TieredActivationCheckpoint starts in created", () => {
  const item = newTieredActivationCheckpoint("code-362", "name-513");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredActivationCheckpoint moves to validated", () => {
  const item = newTieredActivationCheckpoint("code-362", "name-513");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TieredActivationCheckpoint rejects moves from retired", () => {
  const item = newTieredActivationCheckpoint("code-362", "name-513");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
