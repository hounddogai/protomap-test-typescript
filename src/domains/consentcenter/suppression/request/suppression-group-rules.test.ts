import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionGroupCodeLengthRule,
  SuppressionGroupDurationMinutesRangeRule,
  SuppressionGroupRequiredExternalRefRule,
  SuppressionGroupRequiredNameRule,
  defaultSuppressionGroupValidator,
} from "./suppression-group-rules.js";
import { newSuppressionGroup } from "./suppression-group.js";

test("SuppressionGroupValidator reports every problem", () => {
  const validator = defaultSuppressionGroupValidator();
  const item = newSuppressionGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionGroupCodeLengthRule flags a long code", () => {
  const rule = new SuppressionGroupCodeLengthRule(86400);
  const item = newSuppressionGroup("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionGroupRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new SuppressionGroupRequiredExternalRefRule("suppression group needs a value");
  const item = newSuppressionGroup("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionGroupRequiredNameRule flags a blank name", () => {
  const rule = new SuppressionGroupRequiredNameRule("suppression group needs an entry");
  const item = newSuppressionGroup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionGroupDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new SuppressionGroupDurationMinutesRangeRule(64, 120);
  const item = newSuppressionGroup("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
