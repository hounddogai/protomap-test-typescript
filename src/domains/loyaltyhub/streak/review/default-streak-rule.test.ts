import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultStreakRule } from "./default-streak-rule.js";

test("DefaultStreakRule starts in proposed", () => {
  const item = newDefaultStreakRule("code-527", "label-620");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultStreakRule moves to withdrawn", () => {
  const item = newDefaultStreakRule("code-527", "label-620");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("DefaultStreakRule rejects moves from withdrawn", () => {
  const item = newDefaultStreakRule("code-527", "label-620");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
