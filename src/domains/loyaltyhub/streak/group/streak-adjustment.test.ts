import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakAdjustment } from "./streak-adjustment.js";

test("StreakAdjustment starts in requested", () => {
  const item = newStreakAdjustment("code-598", "name-54");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakAdjustment moves to granted", () => {
  const item = newStreakAdjustment("code-598", "name-54");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StreakAdjustment rejects moves from expired", () => {
  const item = newStreakAdjustment("code-598", "name-54");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
