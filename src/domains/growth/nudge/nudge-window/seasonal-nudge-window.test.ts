import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalNudgeWindow } from "./seasonal-nudge-window.js";

test("SeasonalNudgeWindow starts in planned", () => {
  const item = newSeasonalNudgeWindow("code-662", "title-83");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalNudgeWindow moves to in progress", () => {
  const item = newSeasonalNudgeWindow("code-662", "title-83");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("SeasonalNudgeWindow rejects moves from cancelled", () => {
  const item = newSeasonalNudgeWindow("code-662", "title-83");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
