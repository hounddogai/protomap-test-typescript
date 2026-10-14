import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveLevelPreference } from "./adaptive-level-preference.js";

test("AdaptiveLevelPreference starts in idle", () => {
  const item = newAdaptiveLevelPreference("code-296", "name-443");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveLevelPreference moves to ready", () => {
  const item = newAdaptiveLevelPreference("code-296", "name-443");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("AdaptiveLevelPreference rejects moves from stopped", () => {
  const item = newAdaptiveLevelPreference("code-296", "name-443");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
