import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredCsatAudit } from "./tiered-csat-audit.js";

test("TieredCsatAudit starts in planned", () => {
  const item = newTieredCsatAudit("code-173", "title-134");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredCsatAudit moves to scheduled", () => {
  const item = newTieredCsatAudit("code-173", "title-134");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TieredCsatAudit rejects moves from cancelled", () => {
  const item = newTieredCsatAudit("code-173", "title-134");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
