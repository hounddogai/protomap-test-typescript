import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalLevelWindow } from "./seasonal-level-window.js";

test("SeasonalLevelWindow starts in new", () => {
  const item = newSeasonalLevelWindow("code-484", "name-478");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalLevelWindow moves to queued", () => {
  const item = newSeasonalLevelWindow("code-484", "name-478");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SeasonalLevelWindow rejects moves from failed", () => {
  const item = newSeasonalLevelWindow("code-484", "name-478");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
