import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalTouchpointCheckpoint } from "./seasonal-touchpoint-checkpoint.js";

test("SeasonalTouchpointCheckpoint starts in open", () => {
  const item = newSeasonalTouchpointCheckpoint("code-680", "label-720");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalTouchpointCheckpoint moves to in review", () => {
  const item = newSeasonalTouchpointCheckpoint("code-680", "label-720");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SeasonalTouchpointCheckpoint rejects moves from archived", () => {
  const item = newSeasonalTouchpointCheckpoint("code-680", "label-720");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
