import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictStreakNotice } from "./strict-streak-notice.js";

test("StrictStreakNotice starts in new", () => {
  const item = newStrictStreakNotice("code-708", "label-296");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictStreakNotice moves to running", () => {
  const item = newStrictStreakNotice("code-708", "label-296");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("StrictStreakNotice rejects moves from failed", () => {
  const item = newStrictStreakNotice("code-708", "label-296");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
