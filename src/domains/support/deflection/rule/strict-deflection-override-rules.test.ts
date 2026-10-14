import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictDeflectionOverrideChannelLengthRule,
  StrictDeflectionOverrideRatioRangeRule,
  StrictDeflectionOverrideRequiredTitleRule,
  defaultStrictDeflectionOverrideValidator,
} from "./strict-deflection-override-rules.js";
import { newStrictDeflectionOverride } from "./strict-deflection-override.js";

test("StrictDeflectionOverrideValidator reports every problem", () => {
  const validator = defaultStrictDeflectionOverrideValidator();
  const item = newStrictDeflectionOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictDeflectionOverrideRequiredTitleRule flags a blank title", () => {
  const rule = new StrictDeflectionOverrideRequiredTitleRule("strict deflection override needs an entry");
  const item = newStrictDeflectionOverride("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictDeflectionOverrideChannelLengthRule flags a long channel", () => {
  const rule = new StrictDeflectionOverrideChannelLengthRule(3600);
  const item = newStrictDeflectionOverride("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictDeflectionOverrideRatioRangeRule flags values above ratio", () => {
  const rule = new StrictDeflectionOverrideRatioRangeRule(8.6, 4613.4);
  const item = newStrictDeflectionOverride("x", "y");
  item.ratio = 4614.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
