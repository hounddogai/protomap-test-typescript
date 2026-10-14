import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedTouchpointMilestone } from "./capped-touchpoint-milestone.js";

test("CappedTouchpointMilestone starts in idle", () => {
  const item = newCappedTouchpointMilestone("code-483", "name-958");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedTouchpointMilestone moves to ready", () => {
  const item = newCappedTouchpointMilestone("code-483", "name-958");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("CappedTouchpointMilestone rejects moves from stopped", () => {
  const item = newCappedTouchpointMilestone("code-483", "name-958");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
