import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalStreakQuota } from "./seasonal-streak-quota.js";

test("SeasonalStreakQuota starts in idle", () => {
  const item = newSeasonalStreakQuota("code-14", "label-190");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalStreakQuota moves to ready", () => {
  const item = newSeasonalStreakQuota("code-14", "label-190");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SeasonalStreakQuota rejects moves from stopped", () => {
  const item = newSeasonalStreakQuota("code-14", "label-190");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
