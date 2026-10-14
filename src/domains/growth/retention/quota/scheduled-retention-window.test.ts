import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledRetentionWindow } from "./scheduled-retention-window.js";

test("ScheduledRetentionWindow starts in proposed", () => {
  const item = newScheduledRetentionWindow("code-26", "name-733");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledRetentionWindow moves to approved", () => {
  const item = newScheduledRetentionWindow("code-26", "name-733");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ScheduledRetentionWindow rejects moves from withdrawn", () => {
  const item = newScheduledRetentionWindow("code-26", "name-733");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
