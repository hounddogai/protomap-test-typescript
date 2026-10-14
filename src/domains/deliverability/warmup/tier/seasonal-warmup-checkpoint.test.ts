import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalWarmupCheckpoint } from "./seasonal-warmup-checkpoint.js";

test("SeasonalWarmupCheckpoint starts in draft", () => {
  const item = newSeasonalWarmupCheckpoint("code-508", "title-26");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalWarmupCheckpoint moves to pending", () => {
  const item = newSeasonalWarmupCheckpoint("code-508", "title-26");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SeasonalWarmupCheckpoint rejects moves from closed", () => {
  const item = newSeasonalWarmupCheckpoint("code-508", "title-26");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
