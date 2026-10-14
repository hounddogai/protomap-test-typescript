import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredCohortQuota } from "./tiered-cohort-quota.js";

test("TieredCohortQuota starts in idle", () => {
  const item = newTieredCohortQuota("code-997", "title-277");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredCohortQuota moves to draining", () => {
  const item = newTieredCohortQuota("code-997", "title-277");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("TieredCohortQuota rejects moves from stopped", () => {
  const item = newTieredCohortQuota("code-997", "title-277");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
