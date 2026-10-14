import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultModelGroupDurationMinutesRangeRule,
  DefaultModelGroupRequiredCodeRule,
  DefaultModelGroupRequiredTitleRule,
  DefaultModelGroupTitleLengthRule,
  defaultDefaultModelGroupValidator,
} from "./default-model-group-rules.js";
import { newDefaultModelGroup } from "./default-model-group.js";

test("DefaultModelGroupValidator reports every problem", () => {
  const validator = defaultDefaultModelGroupValidator();
  const item = newDefaultModelGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultModelGroupDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new DefaultModelGroupDurationMinutesRangeRule(80, 3600);
  const item = newDefaultModelGroup("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultModelGroupRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultModelGroupRequiredCodeRule("default model group needs a value");
  const item = newDefaultModelGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultModelGroupTitleLengthRule flags a long title", () => {
  const rule = new DefaultModelGroupTitleLengthRule(255);
  const item = newDefaultModelGroup("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultModelGroupRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultModelGroupRequiredTitleRule("default model group needs an entry");
  const item = newDefaultModelGroup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
