import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelMilestone } from "./funnel-milestone.js";

test("FunnelMilestone starts in idle", () => {
  const item = newFunnelMilestone("code-586", "title-632");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelMilestone moves to stopped", () => {
  const item = newFunnelMilestone("code-586", "title-632");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("FunnelMilestone rejects moves from stopped", () => {
  const item = newFunnelMilestone("code-586", "title-632");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
