import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRetentionScore } from "./tiered-retention-score.js";

test("TieredRetentionScore starts in planned", () => {
  const item = newTieredRetentionScore("code-110", "label-819");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRetentionScore moves to in progress", () => {
  const item = newTieredRetentionScore("code-110", "label-819");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("TieredRetentionScore rejects moves from cancelled", () => {
  const item = newTieredRetentionScore("code-110", "label-819");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
