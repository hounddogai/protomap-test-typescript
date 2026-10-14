import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalBadgeBaseline } from "./seasonal-badge-baseline.js";

test("SeasonalBadgeBaseline starts in idle", () => {
  const item = newSeasonalBadgeBaseline("code-968", "title-315");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalBadgeBaseline moves to ready", () => {
  const item = newSeasonalBadgeBaseline("code-968", "title-315");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SeasonalBadgeBaseline rejects moves from stopped", () => {
  const item = newSeasonalBadgeBaseline("code-968", "title-315");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
