import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalChallengeAgreement } from "./regional-challenge-agreement.js";

test("RegionalChallengeAgreement starts in planned", () => {
  const item = newRegionalChallengeAgreement("code-840", "name-568");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalChallengeAgreement moves to completed", () => {
  const item = newRegionalChallengeAgreement("code-840", "name-568");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("RegionalChallengeAgreement rejects moves from cancelled", () => {
  const item = newRegionalChallengeAgreement("code-840", "name-568");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
