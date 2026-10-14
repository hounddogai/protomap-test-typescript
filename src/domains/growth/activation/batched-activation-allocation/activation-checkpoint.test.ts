import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationCheckpoint } from "./activation-checkpoint.js";

test("ActivationCheckpoint starts in new", () => {
  const item = newActivationCheckpoint("code-392", "label-888");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationCheckpoint moves to queued", () => {
  const item = newActivationCheckpoint("code-392", "label-888");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ActivationCheckpoint rejects moves from failed", () => {
  const item = newActivationCheckpoint("code-392", "label-888");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
