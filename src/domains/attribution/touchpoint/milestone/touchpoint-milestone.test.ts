import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointMilestone } from "./touchpoint-milestone.js";

test("TouchpointMilestone starts in created", () => {
  const item = newTouchpointMilestone("code-256", "label-678");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointMilestone moves to retired", () => {
  const item = newTouchpointMilestone("code-256", "label-678");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("TouchpointMilestone rejects moves from retired", () => {
  const item = newTouchpointMilestone("code-256", "label-678");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
