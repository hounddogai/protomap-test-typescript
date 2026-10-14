import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledBounceMilestone } from "./scheduled-bounce-milestone.js";

test("ScheduledBounceMilestone starts in open", () => {
  const item = newScheduledBounceMilestone("code-467", "label-970");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledBounceMilestone moves to in review", () => {
  const item = newScheduledBounceMilestone("code-467", "label-970");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ScheduledBounceMilestone rejects moves from archived", () => {
  const item = newScheduledBounceMilestone("code-467", "label-970");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
