import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyQueueCheckpoint } from "./legacy-queue-checkpoint.js";

test("LegacyQueueCheckpoint starts in created", () => {
  const item = newLegacyQueueCheckpoint("code-659", "label-142");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyQueueCheckpoint moves to published", () => {
  const item = newLegacyQueueCheckpoint("code-659", "label-142");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LegacyQueueCheckpoint rejects moves from retired", () => {
  const item = newLegacyQueueCheckpoint("code-659", "label-142");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
