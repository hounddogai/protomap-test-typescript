import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyModelCheckpoint } from "./legacy-model-checkpoint.js";

test("LegacyModelCheckpoint starts in new", () => {
  const item = newLegacyModelCheckpoint("code-719", "label-219");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyModelCheckpoint moves to running", () => {
  const item = newLegacyModelCheckpoint("code-719", "label-219");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LegacyModelCheckpoint rejects moves from failed", () => {
  const item = newLegacyModelCheckpoint("code-719", "label-219");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
