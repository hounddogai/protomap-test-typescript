import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledBounceScore } from "./scheduled-bounce-score.js";

test("ScheduledBounceScore starts in idle", () => {
  const item = newScheduledBounceScore("code-150", "title-514");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledBounceScore moves to warming", () => {
  const item = newScheduledBounceScore("code-150", "title-514");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ScheduledBounceScore rejects moves from stopped", () => {
  const item = newScheduledBounceScore("code-150", "title-514");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
