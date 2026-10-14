import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingExitRuleCheckpoint } from "./rolling-exit-rule-checkpoint.js";

test("RollingExitRuleCheckpoint starts in created", () => {
  const item = newRollingExitRuleCheckpoint("code-476", "name-651");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingExitRuleCheckpoint moves to validated", () => {
  const item = newRollingExitRuleCheckpoint("code-476", "name-651");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RollingExitRuleCheckpoint rejects moves from retired", () => {
  const item = newRollingExitRuleCheckpoint("code-476", "name-651");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
