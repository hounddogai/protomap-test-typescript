import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveMacroCheckpoint } from "./adaptive-macro-checkpoint.js";

test("AdaptiveMacroCheckpoint starts in planned", () => {
  const item = newAdaptiveMacroCheckpoint("code-151", "name-760");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveMacroCheckpoint moves to in progress", () => {
  const item = newAdaptiveMacroCheckpoint("code-151", "name-760");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("AdaptiveMacroCheckpoint rejects moves from cancelled", () => {
  const item = newAdaptiveMacroCheckpoint("code-151", "name-760");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
