import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakEntry } from "./streak-entry.js";

test("StreakEntry starts in created", () => {
  const item = newStreakEntry("code-121", "label-847");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakEntry moves to retired", () => {
  const item = newStreakEntry("code-121", "label-847");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("StreakEntry rejects moves from retired", () => {
  const item = newStreakEntry("code-121", "label-847");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
