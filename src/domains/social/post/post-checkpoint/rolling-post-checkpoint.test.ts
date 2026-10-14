import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPostCheckpoint } from "./rolling-post-checkpoint.js";

test("RollingPostCheckpoint starts in created", () => {
  const item = newRollingPostCheckpoint("code-992", "name-203");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPostCheckpoint moves to published", () => {
  const item = newRollingPostCheckpoint("code-992", "name-203");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RollingPostCheckpoint rejects moves from retired", () => {
  const item = newRollingPostCheckpoint("code-992", "name-203");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
