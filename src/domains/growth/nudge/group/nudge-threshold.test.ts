import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeThreshold } from "./nudge-threshold.js";

test("NudgeThreshold starts in new", () => {
  const item = newNudgeThreshold("code-321", "label-601");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeThreshold moves to running", () => {
  const item = newNudgeThreshold("code-321", "label-601");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("NudgeThreshold rejects moves from failed", () => {
  const item = newNudgeThreshold("code-321", "label-601");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
