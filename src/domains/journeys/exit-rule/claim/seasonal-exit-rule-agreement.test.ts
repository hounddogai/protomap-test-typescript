import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalExitRuleAgreement } from "./seasonal-exit-rule-agreement.js";

test("SeasonalExitRuleAgreement starts in open", () => {
  const item = newSeasonalExitRuleAgreement("code-618", "title-971");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalExitRuleAgreement moves to in review", () => {
  const item = newSeasonalExitRuleAgreement("code-618", "title-971");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SeasonalExitRuleAgreement rejects moves from archived", () => {
  const item = newSeasonalExitRuleAgreement("code-618", "title-971");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
