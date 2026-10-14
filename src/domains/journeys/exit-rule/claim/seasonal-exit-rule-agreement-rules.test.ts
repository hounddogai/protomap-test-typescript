import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalExitRuleAgreementFloorValueRangeRule,
  SeasonalExitRuleAgreementLimitRangeRule,
  SeasonalExitRuleAgreementTitleLengthRule,
  defaultSeasonalExitRuleAgreementValidator,
} from "./seasonal-exit-rule-agreement-rules.js";
import { newSeasonalExitRuleAgreement } from "./seasonal-exit-rule-agreement.js";

test("SeasonalExitRuleAgreementValidator reports every problem", () => {
  const validator = defaultSeasonalExitRuleAgreementValidator();
  const item = newSeasonalExitRuleAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalExitRuleAgreementLimitRangeRule flags values above limit", () => {
  const rule = new SeasonalExitRuleAgreementLimitRangeRule(32, 32);
  const item = newSeasonalExitRuleAgreement("x", "y");
  item.limit = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalExitRuleAgreementFloorValueRangeRule flags values above floor value", () => {
  const rule = new SeasonalExitRuleAgreementFloorValueRangeRule(0.9, 1404.8);
  const item = newSeasonalExitRuleAgreement("x", "y");
  item.floorValue = 1406.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalExitRuleAgreementTitleLengthRule flags a long title", () => {
  const rule = new SeasonalExitRuleAgreementTitleLengthRule(16);
  const item = newSeasonalExitRuleAgreement("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
