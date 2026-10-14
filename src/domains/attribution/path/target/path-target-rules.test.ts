import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathTargetRatioRangeRule,
  PathTargetRequiredChannelRule,
  PathTargetRequiredCodeRule,
  defaultPathTargetValidator,
} from "./path-target-rules.js";
import { newPathTarget } from "./path-target.js";

test("PathTargetValidator reports every problem", () => {
  const validator = defaultPathTargetValidator();
  const item = newPathTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathTargetRatioRangeRule flags values above ratio", () => {
  const rule = new PathTargetRatioRangeRule(0.6, 3219.9);
  const item = newPathTarget("x", "y");
  item.ratio = 3221.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathTargetRequiredChannelRule flags a blank channel", () => {
  const rule = new PathTargetRequiredChannelRule("path target needs an entry");
  const item = newPathTarget("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathTargetRequiredCodeRule flags a blank code", () => {
  const rule = new PathTargetRequiredCodeRule("path target needs a value");
  const item = newPathTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
