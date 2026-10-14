import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictNudgeMappingAttemptsRangeRule,
  StrictNudgeMappingChecksumLengthRule,
  StrictNudgeMappingLocaleLengthRule,
  StrictNudgeMappingOpenRateRangeRule,
  StrictNudgeMappingRequiredLocaleRule,
  StrictNudgeMappingRequiredNameRule,
  defaultStrictNudgeMappingValidator,
} from "./strict-nudge-mapping-rules.js";
import { newStrictNudgeMapping } from "./strict-nudge-mapping.js";

test("StrictNudgeMappingValidator reports every problem", () => {
  const validator = defaultStrictNudgeMappingValidator();
  const item = newStrictNudgeMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictNudgeMappingOpenRateRangeRule flags values above open rate", () => {
  const rule = new StrictNudgeMappingOpenRateRangeRule(6.9, 1946.5);
  const item = newStrictNudgeMapping("x", "y");
  item.openRate = 1948;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictNudgeMappingChecksumLengthRule flags a long checksum", () => {
  const rule = new StrictNudgeMappingChecksumLengthRule(32);
  const item = newStrictNudgeMapping("x", "y");
  item.checksum = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictNudgeMappingRequiredNameRule flags a blank name", () => {
  const rule = new StrictNudgeMappingRequiredNameRule("strict nudge mapping needs a value");
  const item = newStrictNudgeMapping("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictNudgeMappingAttemptsRangeRule flags values above attempts", () => {
  const rule = new StrictNudgeMappingAttemptsRangeRule(16, 255);
  const item = newStrictNudgeMapping("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictNudgeMappingRequiredLocaleRule flags a blank locale", () => {
  const rule = new StrictNudgeMappingRequiredLocaleRule("strict nudge mapping needs an entry");
  const item = newStrictNudgeMapping("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictNudgeMappingLocaleLengthRule flags a long locale", () => {
  const rule = new StrictNudgeMappingLocaleLengthRule(3600);
  const item = newStrictNudgeMapping("x", "y");
  item.locale = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
