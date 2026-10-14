import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledWarmupThreshold } from "./scheduled-warmup-threshold.js";

test("ScheduledWarmupThreshold starts in planned", () => {
  const item = newScheduledWarmupThreshold("code-818", "title-901");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledWarmupThreshold moves to scheduled", () => {
  const item = newScheduledWarmupThreshold("code-818", "title-901");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ScheduledWarmupThreshold rejects moves from cancelled", () => {
  const item = newScheduledWarmupThreshold("code-818", "title-901");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
