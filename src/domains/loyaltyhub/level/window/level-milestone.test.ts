import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelMilestone } from "./level-milestone.js";

test("LevelMilestone starts in idle", () => {
  const item = newLevelMilestone("code-261", "label-217");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelMilestone moves to draining", () => {
  const item = newLevelMilestone("code-261", "label-217");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("LevelMilestone rejects moves from stopped", () => {
  const item = newLevelMilestone("code-261", "label-217");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
