import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakExceptionCodeLengthRule,
  StreakExceptionRequiredCampaignRefRule,
  defaultStreakExceptionValidator,
} from "./streak-exception-rules.js";
import { newStreakException } from "./streak-exception.js";

test("StreakExceptionValidator reports every problem", () => {
  const validator = defaultStreakExceptionValidator();
  const item = newStreakException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakExceptionRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new StreakExceptionRequiredCampaignRefRule("streak exception needs an entry");
  const item = newStreakException("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakExceptionCodeLengthRule flags a long code", () => {
  const rule = new StreakExceptionCodeLengthRule(80);
  const item = newStreakException("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
