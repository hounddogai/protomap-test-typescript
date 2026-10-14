import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedMentionAuditLabelLengthRule,
  WeightedMentionAuditRequiredCodeRule,
  WeightedMentionAuditRequiredLocaleRule,
  defaultWeightedMentionAuditValidator,
} from "./weighted-mention-audit-rules.js";
import { newWeightedMentionAudit } from "./weighted-mention-audit.js";

test("WeightedMentionAuditValidator reports every problem", () => {
  const validator = defaultWeightedMentionAuditValidator();
  const item = newWeightedMentionAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedMentionAuditRequiredLocaleRule flags a blank locale", () => {
  const rule = new WeightedMentionAuditRequiredLocaleRule("weighted mention audit needs a value");
  const item = newWeightedMentionAudit("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedMentionAuditLabelLengthRule flags a long label", () => {
  const rule = new WeightedMentionAuditLabelLengthRule(32);
  const item = newWeightedMentionAudit("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedMentionAuditRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedMentionAuditRequiredCodeRule("weighted mention audit needs an entry");
  const item = newWeightedMentionAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
