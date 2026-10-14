import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingWindowTargetCeilingRangeRule,
  RollingWindowTargetCodeLengthRule,
  RollingWindowTargetRequiredTitleRule,
  defaultRollingWindowTargetValidator,
} from "./rolling-window-target-rules.js";
import { newRollingWindowTarget } from "./rolling-window-target.js";

test("RollingWindowTargetValidator reports every problem", () => {
  const validator = defaultRollingWindowTargetValidator();
  const item = newRollingWindowTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingWindowTargetCodeLengthRule flags a long code", () => {
  const rule = new RollingWindowTargetCodeLengthRule(80);
  const item = newRollingWindowTarget("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingWindowTargetCeilingRangeRule flags values above ceiling", () => {
  const rule = new RollingWindowTargetCeilingRangeRule(0.3, 2902.2);
  const item = newRollingWindowTarget("x", "y");
  item.ceiling = 2903.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingWindowTargetRequiredTitleRule flags a blank title", () => {
  const rule = new RollingWindowTargetRequiredTitleRule("rolling window target needs an entry");
  const item = newRollingWindowTarget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
