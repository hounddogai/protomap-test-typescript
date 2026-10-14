import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalWarmupWindow } from "./seasonal-warmup-window.js";

test("SeasonalWarmupWindow starts in new", () => {
  const item = newSeasonalWarmupWindow("code-591", "title-576");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalWarmupWindow moves to done", () => {
  const item = newSeasonalWarmupWindow("code-591", "title-576");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("SeasonalWarmupWindow rejects moves from failed", () => {
  const item = newSeasonalWarmupWindow("code-591", "title-576");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
