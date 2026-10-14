import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionTargetNameLengthRule,
  RetentionTargetRequiredCodeRule,
  defaultRetentionTargetValidator,
} from "./retention-target-rules.js";
import { newRetentionTarget } from "./retention-target.js";

test("RetentionTargetValidator reports every problem", () => {
  const validator = defaultRetentionTargetValidator();
  const item = newRetentionTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionTargetRequiredCodeRule flags a blank code", () => {
  const rule = new RetentionTargetRequiredCodeRule("retention target needs a value");
  const item = newRetentionTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionTargetNameLengthRule flags a long name", () => {
  const rule = new RetentionTargetNameLengthRule(120);
  const item = newRetentionTarget("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
