import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredCohortAdjustment } from "./tiered-cohort-adjustment.js";

test("TieredCohortAdjustment starts in new", () => {
  const item = newTieredCohortAdjustment("code-301", "name-698");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredCohortAdjustment moves to failed", () => {
  const item = newTieredCohortAdjustment("code-301", "name-698");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("TieredCohortAdjustment rejects moves from failed", () => {
  const item = newTieredCohortAdjustment("code-301", "name-698");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
