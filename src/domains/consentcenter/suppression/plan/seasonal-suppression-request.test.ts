import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalSuppressionRequest } from "./seasonal-suppression-request.js";

test("SeasonalSuppressionRequest starts in idle", () => {
  const item = newSeasonalSuppressionRequest("code-888", "name-843");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalSuppressionRequest moves to draining", () => {
  const item = newSeasonalSuppressionRequest("code-888", "name-843");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("SeasonalSuppressionRequest rejects moves from stopped", () => {
  const item = newSeasonalSuppressionRequest("code-888", "name-843");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
