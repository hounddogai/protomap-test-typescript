import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedWaitPreference } from "./batched-wait-preference.js";

test("BatchedWaitPreference starts in idle", () => {
  const item = newBatchedWaitPreference("code-481", "title-657");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedWaitPreference moves to draining", () => {
  const item = newBatchedWaitPreference("code-481", "title-657");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("BatchedWaitPreference rejects moves from stopped", () => {
  const item = newBatchedWaitPreference("code-481", "title-657");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
