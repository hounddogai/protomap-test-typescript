import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredCohortLedger } from "./tiered-cohort-ledger.js";

test("TieredCohortLedger starts in open", () => {
  const item = newTieredCohortLedger("code-69", "name-796");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredCohortLedger moves to in review", () => {
  const item = newTieredCohortLedger("code-69", "name-796");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("TieredCohortLedger rejects moves from archived", () => {
  const item = newTieredCohortLedger("code-69", "name-796");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
