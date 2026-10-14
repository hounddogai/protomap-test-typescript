import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledPlacementNotice } from "./scheduled-placement-notice.js";

test("ScheduledPlacementNotice starts in new", () => {
  const item = newScheduledPlacementNotice("code-244", "label-126");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledPlacementNotice moves to failed", () => {
  const item = newScheduledPlacementNotice("code-244", "label-126");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("ScheduledPlacementNotice rejects moves from failed", () => {
  const item = newScheduledPlacementNotice("code-244", "label-126");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
