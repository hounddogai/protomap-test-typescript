import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalStreakPolicy } from "./seasonal-streak-policy.js";

test("SeasonalStreakPolicy starts in open", () => {
  const item = newSeasonalStreakPolicy("code-602", "name-383");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalStreakPolicy moves to resolved", () => {
  const item = newSeasonalStreakPolicy("code-602", "name-383");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("SeasonalStreakPolicy rejects moves from archived", () => {
  const item = newSeasonalStreakPolicy("code-602", "name-383");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
