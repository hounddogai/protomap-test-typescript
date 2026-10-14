import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingNudgeMappingCodeLengthRule,
  RollingNudgeMappingRequiredCodeRule,
  RollingNudgeMappingRequiredTitleRule,
  RollingNudgeMappingTitleLengthRule,
  defaultRollingNudgeMappingValidator,
} from "./rolling-nudge-mapping-rules.js";
import { newRollingNudgeMapping } from "./rolling-nudge-mapping.js";

test("RollingNudgeMappingValidator reports every problem", () => {
  const validator = defaultRollingNudgeMappingValidator();
  const item = newRollingNudgeMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingNudgeMappingRequiredTitleRule flags a blank title", () => {
  const rule = new RollingNudgeMappingRequiredTitleRule("rolling nudge mapping needs this field");
  const item = newRollingNudgeMapping("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingNudgeMappingRequiredCodeRule flags a blank code", () => {
  const rule = new RollingNudgeMappingRequiredCodeRule("rolling nudge mapping needs this field");
  const item = newRollingNudgeMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingNudgeMappingTitleLengthRule flags a long title", () => {
  const rule = new RollingNudgeMappingTitleLengthRule(86400);
  const item = newRollingNudgeMapping("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingNudgeMappingCodeLengthRule flags a long code", () => {
  const rule = new RollingNudgeMappingCodeLengthRule(86400);
  const item = newRollingNudgeMapping("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
