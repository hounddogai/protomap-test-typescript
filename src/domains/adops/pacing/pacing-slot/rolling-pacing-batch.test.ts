import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPacingBatch } from "./rolling-pacing-batch.js";

test("RollingPacingBatch starts in created", () => {
  const item = newRollingPacingBatch("code-716", "name-67");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPacingBatch moves to published", () => {
  const item = newRollingPacingBatch("code-716", "name-67");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RollingPacingBatch rejects moves from retired", () => {
  const item = newRollingPacingBatch("code-716", "name-67");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
