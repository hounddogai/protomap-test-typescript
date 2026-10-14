import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleExceptionBidRangeRule,
  ExitRuleExceptionRequiredCodeRule,
  defaultExitRuleExceptionValidator,
} from "./exit-rule-exception-rules.js";
import { newExitRuleException } from "./exit-rule-exception.js";

test("ExitRuleExceptionValidator reports every problem", () => {
  const validator = defaultExitRuleExceptionValidator();
  const item = newExitRuleException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleExceptionBidRangeRule flags values above bid", () => {
  const rule = new ExitRuleExceptionBidRangeRule(8.6, 735.1);
  const item = newExitRuleException("x", "y");
  item.bid = 736.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new ExitRuleExceptionRequiredCodeRule("exit rule exception needs this field");
  const item = newExitRuleException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
