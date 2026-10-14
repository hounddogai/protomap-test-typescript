import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultRewardRuleWindowCodeLengthRule,
  DefaultRewardRuleWindowRequiredTitleRule,
  defaultDefaultRewardRuleWindowValidator,
} from "./default-reward-rule-window-rules.js";
import { newDefaultRewardRuleWindow } from "./default-reward-rule-window.js";

test("DefaultRewardRuleWindowValidator reports every problem", () => {
  const validator = defaultDefaultRewardRuleWindowValidator();
  const item = newDefaultRewardRuleWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultRewardRuleWindowCodeLengthRule flags a long code", () => {
  const rule = new DefaultRewardRuleWindowCodeLengthRule(80);
  const item = newDefaultRewardRuleWindow("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultRewardRuleWindowRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultRewardRuleWindowRequiredTitleRule("default reward rule window needs a value");
  const item = newDefaultRewardRuleWindow("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
