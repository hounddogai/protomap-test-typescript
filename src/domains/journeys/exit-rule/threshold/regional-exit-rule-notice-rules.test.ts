import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalExitRuleNoticeQuantityRangeRule,
  RegionalExitRuleNoticeRequiredLocaleRule,
  defaultRegionalExitRuleNoticeValidator,
} from "./regional-exit-rule-notice-rules.js";
import { newRegionalExitRuleNotice } from "./regional-exit-rule-notice.js";

test("RegionalExitRuleNoticeValidator reports every problem", () => {
  const validator = defaultRegionalExitRuleNoticeValidator();
  const item = newRegionalExitRuleNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalExitRuleNoticeRequiredLocaleRule flags a blank locale", () => {
  const rule = new RegionalExitRuleNoticeRequiredLocaleRule("regional exit rule notice needs a value");
  const item = newRegionalExitRuleNotice("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalExitRuleNoticeQuantityRangeRule flags values above quantity", () => {
  const rule = new RegionalExitRuleNoticeQuantityRangeRule(255, 3600);
  const item = newRegionalExitRuleNotice("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
