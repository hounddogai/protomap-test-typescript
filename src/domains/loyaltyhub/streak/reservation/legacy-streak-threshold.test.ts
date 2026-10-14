import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyStreakThreshold } from "./legacy-streak-threshold.js";

test("LegacyStreakThreshold starts in created", () => {
  const item = newLegacyStreakThreshold("code-594", "label-768");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyStreakThreshold moves to published", () => {
  const item = newLegacyStreakThreshold("code-594", "label-768");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LegacyStreakThreshold rejects moves from retired", () => {
  const item = newLegacyStreakThreshold("code-594", "label-768");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
