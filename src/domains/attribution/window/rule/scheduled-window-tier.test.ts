import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledWindowTier } from "./scheduled-window-tier.js";

test("ScheduledWindowTier starts in planned", () => {
  const item = newScheduledWindowTier("code-686", "title-85");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledWindowTier moves to completed", () => {
  const item = newScheduledWindowTier("code-686", "title-85");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("ScheduledWindowTier rejects moves from cancelled", () => {
  const item = newScheduledWindowTier("code-686", "title-85");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
