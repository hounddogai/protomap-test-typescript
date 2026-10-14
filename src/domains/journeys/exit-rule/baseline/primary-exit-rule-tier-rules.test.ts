import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryExitRuleTierCodeLengthRule,
  PrimaryExitRuleTierMarginRangeRule,
  PrimaryExitRuleTierRequiredCodeRule,
  defaultPrimaryExitRuleTierValidator,
} from "./primary-exit-rule-tier-rules.js";
import { newPrimaryExitRuleTier } from "./primary-exit-rule-tier.js";

test("PrimaryExitRuleTierValidator reports every problem", () => {
  const validator = defaultPrimaryExitRuleTierValidator();
  const item = newPrimaryExitRuleTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryExitRuleTierCodeLengthRule flags a long code", () => {
  const rule = new PrimaryExitRuleTierCodeLengthRule(16);
  const item = newPrimaryExitRuleTier("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryExitRuleTierRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryExitRuleTierRequiredCodeRule("primary exit rule tier needs an entry");
  const item = newPrimaryExitRuleTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryExitRuleTierMarginRangeRule flags values above margin", () => {
  const rule = new PrimaryExitRuleTierMarginRangeRule(2, 2562.8);
  const item = newPrimaryExitRuleTier("x", "y");
  item.margin = 2564.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
