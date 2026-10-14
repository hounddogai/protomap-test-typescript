import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPathProfile } from "./batched-path-profile.js";

test("BatchedPathProfile starts in idle", () => {
  const item = newBatchedPathProfile("code-952", "label-685");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPathProfile moves to stopped", () => {
  const item = newBatchedPathProfile("code-952", "label-685");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("BatchedPathProfile rejects moves from stopped", () => {
  const item = newBatchedPathProfile("code-952", "label-685");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
