import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredTouchpointCheckpoint } from "./tiered-touchpoint-checkpoint.js";

test("TieredTouchpointCheckpoint starts in new", () => {
  const item = newTieredTouchpointCheckpoint("code-796", "name-507");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredTouchpointCheckpoint moves to done", () => {
  const item = newTieredTouchpointCheckpoint("code-796", "name-507");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("TieredTouchpointCheckpoint rejects moves from failed", () => {
  const item = newTieredTouchpointCheckpoint("code-796", "name-507");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
