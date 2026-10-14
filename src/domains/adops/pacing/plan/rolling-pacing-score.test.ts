import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPacingScore } from "./rolling-pacing-score.js";

test("RollingPacingScore starts in planned", () => {
  const item = newRollingPacingScore("code-826", "name-265");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPacingScore moves to in progress", () => {
  const item = newRollingPacingScore("code-826", "name-265");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RollingPacingScore rejects moves from cancelled", () => {
  const item = newRollingPacingScore("code-826", "name-265");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
