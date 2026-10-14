import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveComplaintGroup } from "./adaptive-complaint-group.js";

test("AdaptiveComplaintGroup starts in planned", () => {
  const item = newAdaptiveComplaintGroup("code-142", "name-831");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveComplaintGroup moves to in progress", () => {
  const item = newAdaptiveComplaintGroup("code-142", "name-831");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("AdaptiveComplaintGroup rejects moves from cancelled", () => {
  const item = newAdaptiveComplaintGroup("code-142", "name-831");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
