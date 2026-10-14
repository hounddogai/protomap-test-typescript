import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledRetentionScore } from "./scheduled-retention-score.js";

test("ScheduledRetentionScore starts in draft", () => {
  const item = newScheduledRetentionScore("code-182", "label-530");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledRetentionScore moves to active", () => {
  const item = newScheduledRetentionScore("code-182", "label-530");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ScheduledRetentionScore rejects moves from closed", () => {
  const item = newScheduledRetentionScore("code-182", "label-530");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
