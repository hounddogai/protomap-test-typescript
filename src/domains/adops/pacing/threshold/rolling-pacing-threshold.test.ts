import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPacingThreshold } from "./rolling-pacing-threshold.js";

test("RollingPacingThreshold starts in created", () => {
  const item = newRollingPacingThreshold("code-106", "name-369");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPacingThreshold moves to published", () => {
  const item = newRollingPacingThreshold("code-106", "name-369");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RollingPacingThreshold rejects moves from retired", () => {
  const item = newRollingPacingThreshold("code-106", "name-369");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
