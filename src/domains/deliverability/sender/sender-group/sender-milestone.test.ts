import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderMilestone } from "./sender-milestone.js";

test("SenderMilestone starts in idle", () => {
  const item = newSenderMilestone("code-142", "label-459");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderMilestone moves to ready", () => {
  const item = newSenderMilestone("code-142", "label-459");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SenderMilestone rejects moves from stopped", () => {
  const item = newSenderMilestone("code-142", "label-459");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
