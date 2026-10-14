import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPlacementMilestone } from "./default-placement-milestone.js";

test("DefaultPlacementMilestone starts in open", () => {
  const item = newDefaultPlacementMilestone("code-738", "name-709");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPlacementMilestone moves to resolved", () => {
  const item = newDefaultPlacementMilestone("code-738", "name-709");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("DefaultPlacementMilestone rejects moves from archived", () => {
  const item = newDefaultPlacementMilestone("code-738", "name-709");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
