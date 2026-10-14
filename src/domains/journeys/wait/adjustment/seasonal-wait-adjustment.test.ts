import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalWaitAdjustment } from "./seasonal-wait-adjustment.js";

test("SeasonalWaitAdjustment starts in open", () => {
  const item = newSeasonalWaitAdjustment("code-134", "label-711");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalWaitAdjustment moves to in review", () => {
  const item = newSeasonalWaitAdjustment("code-134", "label-711");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SeasonalWaitAdjustment rejects moves from archived", () => {
  const item = newSeasonalWaitAdjustment("code-134", "label-711");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
