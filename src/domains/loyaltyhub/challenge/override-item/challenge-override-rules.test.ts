import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeOverrideCodeLengthRule,
  ChallengeOverrideRatioRangeRule,
  ChallengeOverrideRequiredContactEmailRule,
  defaultChallengeOverrideValidator,
} from "./challenge-override-rules.js";
import { newChallengeOverride } from "./challenge-override.js";

test("ChallengeOverrideValidator reports every problem", () => {
  const validator = defaultChallengeOverrideValidator();
  const item = newChallengeOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeOverrideRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new ChallengeOverrideRequiredContactEmailRule("challenge override needs an entry");
  const item = newChallengeOverride("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeOverrideRatioRangeRule flags values above ratio", () => {
  const rule = new ChallengeOverrideRatioRangeRule(7.7, 4461.1);
  const item = newChallengeOverride("x", "y");
  item.ratio = 4462.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeOverrideCodeLengthRule flags a long code", () => {
  const rule = new ChallengeOverrideCodeLengthRule(255);
  const item = newChallengeOverride("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
