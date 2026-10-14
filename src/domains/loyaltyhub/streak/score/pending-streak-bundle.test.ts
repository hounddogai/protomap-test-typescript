import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingStreakBundle } from "./pending-streak-bundle.js";

test("PendingStreakBundle starts in draft", () => {
  const item = newPendingStreakBundle("code-646", "label-896");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingStreakBundle moves to active", () => {
  const item = newPendingStreakBundle("code-646", "label-896");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PendingStreakBundle rejects moves from closed", () => {
  const item = newPendingStreakBundle("code-646", "label-896");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
