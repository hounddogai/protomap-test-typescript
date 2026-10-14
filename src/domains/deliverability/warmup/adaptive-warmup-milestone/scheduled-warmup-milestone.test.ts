import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledWarmupMilestone } from "./scheduled-warmup-milestone.js";

test("ScheduledWarmupMilestone starts in proposed", () => {
  const item = newScheduledWarmupMilestone("code-343", "label-451");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledWarmupMilestone moves to withdrawn", () => {
  const item = newScheduledWarmupMilestone("code-343", "label-451");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("ScheduledWarmupMilestone rejects moves from withdrawn", () => {
  const item = newScheduledWarmupMilestone("code-343", "label-451");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
