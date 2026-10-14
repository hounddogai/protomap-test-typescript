import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalInsightTarget } from "./seasonal-insight-target.js";

test("SeasonalInsightTarget starts in idle", () => {
  const item = newSeasonalInsightTarget("code-12", "label-201");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalInsightTarget moves to stopped", () => {
  const item = newSeasonalInsightTarget("code-12", "label-201");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("SeasonalInsightTarget rejects moves from stopped", () => {
  const item = newSeasonalInsightTarget("code-12", "label-201");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
