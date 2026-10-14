import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPacingAudit } from "./tiered-pacing-audit.js";

test("TieredPacingAudit starts in proposed", () => {
  const item = newTieredPacingAudit("code-339", "title-732");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPacingAudit moves to approved", () => {
  const item = newTieredPacingAudit("code-339", "title-732");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TieredPacingAudit rejects moves from withdrawn", () => {
  const item = newTieredPacingAudit("code-339", "title-732");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
