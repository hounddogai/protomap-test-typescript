import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionMilestone } from "./retention-milestone.js";

test("RetentionMilestone starts in idle", () => {
  const item = newRetentionMilestone("code-880", "label-532");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionMilestone moves to ready", () => {
  const item = newRetentionMilestone("code-880", "label-532");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RetentionMilestone rejects moves from stopped", () => {
  const item = newRetentionMilestone("code-880", "label-532");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
