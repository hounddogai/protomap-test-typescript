import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredCohortAudit } from "./tiered-cohort-audit.js";

test("TieredCohortAudit starts in proposed", () => {
  const item = newTieredCohortAudit("code-733", "label-592");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredCohortAudit moves to withdrawn", () => {
  const item = newTieredCohortAudit("code-733", "label-592");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("TieredCohortAudit rejects moves from withdrawn", () => {
  const item = newTieredCohortAudit("code-733", "label-592");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
