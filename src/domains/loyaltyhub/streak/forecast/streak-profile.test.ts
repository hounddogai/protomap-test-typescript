import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakProfile } from "./streak-profile.js";

test("StreakProfile starts in new", () => {
  const item = newStreakProfile("code-450", "label-921");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakProfile moves to failed", () => {
  const item = newStreakProfile("code-450", "label-921");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("StreakProfile rejects moves from failed", () => {
  const item = newStreakProfile("code-450", "label-921");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
