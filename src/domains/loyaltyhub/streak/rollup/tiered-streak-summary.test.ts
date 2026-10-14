import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredStreakSummary } from "./tiered-streak-summary.js";

test("TieredStreakSummary starts in created", () => {
  const item = newTieredStreakSummary("code-210", "name-831");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredStreakSummary moves to validated", () => {
  const item = newTieredStreakSummary("code-210", "name-831");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TieredStreakSummary rejects moves from retired", () => {
  const item = newTieredStreakSummary("code-210", "name-831");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
