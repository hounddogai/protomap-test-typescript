import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredChallengeAudit } from "./tiered-challenge-audit.js";

test("TieredChallengeAudit starts in planned", () => {
  const item = newTieredChallengeAudit("code-596", "label-468");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredChallengeAudit moves to scheduled", () => {
  const item = newTieredChallengeAudit("code-596", "label-468");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TieredChallengeAudit rejects moves from cancelled", () => {
  const item = newTieredChallengeAudit("code-596", "label-468");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
