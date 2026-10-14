import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakBaseline } from "./streak-baseline.js";

test("StreakBaseline starts in idle", () => {
  const item = newStreakBaseline("code-507", "name-12");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakBaseline moves to ready", () => {
  const item = newStreakBaseline("code-507", "name-12");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("StreakBaseline rejects moves from stopped", () => {
  const item = newStreakBaseline("code-507", "name-12");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
