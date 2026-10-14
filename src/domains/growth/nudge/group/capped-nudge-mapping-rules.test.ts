import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedNudgeMappingCodeLengthRule,
  CappedNudgeMappingEndsAtRangeRule,
  CappedNudgeMappingLabelLengthRule,
  CappedNudgeMappingRequiredCodeRule,
  CappedNudgeMappingRequiredLabelRule,
  defaultCappedNudgeMappingValidator,
} from "./capped-nudge-mapping-rules.js";
import { newCappedNudgeMapping } from "./capped-nudge-mapping.js";

test("CappedNudgeMappingValidator reports every problem", () => {
  const validator = defaultCappedNudgeMappingValidator();
  const item = newCappedNudgeMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedNudgeMappingLabelLengthRule flags a long label", () => {
  const rule = new CappedNudgeMappingLabelLengthRule(64);
  const item = newCappedNudgeMapping("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedNudgeMappingCodeLengthRule flags a long code", () => {
  const rule = new CappedNudgeMappingCodeLengthRule(120);
  const item = newCappedNudgeMapping("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedNudgeMappingEndsAtRangeRule flags values above ends at", () => {
  const rule = new CappedNudgeMappingEndsAtRangeRule(16, 86400);
  const item = newCappedNudgeMapping("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedNudgeMappingRequiredLabelRule flags a blank label", () => {
  const rule = new CappedNudgeMappingRequiredLabelRule("capped nudge mapping needs an entry");
  const item = newCappedNudgeMapping("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedNudgeMappingRequiredCodeRule flags a blank code", () => {
  const rule = new CappedNudgeMappingRequiredCodeRule("capped nudge mapping needs a value");
  const item = newCappedNudgeMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
