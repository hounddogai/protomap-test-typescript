import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleCheckpoint } from "./exit-rule-checkpoint.js";

test("ExitRuleCheckpoint starts in planned", () => {
  const item = newExitRuleCheckpoint("code-637", "title-386");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleCheckpoint moves to in progress", () => {
  const item = newExitRuleCheckpoint("code-637", "title-386");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ExitRuleCheckpoint rejects moves from cancelled", () => {
  const item = newExitRuleCheckpoint("code-637", "title-386");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
