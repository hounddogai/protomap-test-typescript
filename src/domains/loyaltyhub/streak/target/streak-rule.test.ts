import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakRule } from "./streak-rule.js";

test("StreakRule starts in idle", () => {
  const item = newStreakRule("code-470", "label-975");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakRule moves to warming", () => {
  const item = newStreakRule("code-470", "label-975");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("StreakRule rejects moves from stopped", () => {
  const item = newStreakRule("code-470", "label-975");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
