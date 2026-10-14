import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalModelCheckpoint } from "./global-model-checkpoint.js";

test("GlobalModelCheckpoint starts in planned", () => {
  const item = newGlobalModelCheckpoint("code-898", "name-146");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalModelCheckpoint moves to in progress", () => {
  const item = newGlobalModelCheckpoint("code-898", "name-146");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("GlobalModelCheckpoint rejects moves from cancelled", () => {
  const item = newGlobalModelCheckpoint("code-898", "name-146");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
