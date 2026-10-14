import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveMentionSchedule } from "./adaptive-mention-schedule.js";

test("AdaptiveMentionSchedule starts in new", () => {
  const item = newAdaptiveMentionSchedule("code-700", "label-823");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveMentionSchedule moves to failed", () => {
  const item = newAdaptiveMentionSchedule("code-700", "label-823");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("AdaptiveMentionSchedule rejects moves from failed", () => {
  const item = newAdaptiveMentionSchedule("code-700", "label-823");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
