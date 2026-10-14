import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalCreditAgreement } from "./seasonal-credit-agreement.js";

test("SeasonalCreditAgreement starts in created", () => {
  const item = newSeasonalCreditAgreement("code-832", "name-817");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalCreditAgreement moves to retired", () => {
  const item = newSeasonalCreditAgreement("code-832", "name-817");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("SeasonalCreditAgreement rejects moves from retired", () => {
  const item = newSeasonalCreditAgreement("code-832", "name-817");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
