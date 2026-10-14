import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualStreakTarget } from "./manual-streak-target.js";

test("ManualStreakTarget starts in created", () => {
  const item = newManualStreakTarget("code-307", "name-492");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualStreakTarget moves to published", () => {
  const item = newManualStreakTarget("code-307", "name-492");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ManualStreakTarget rejects moves from retired", () => {
  const item = newManualStreakTarget("code-307", "name-492");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
