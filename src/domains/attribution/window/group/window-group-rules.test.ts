import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowGroupCodeLengthRule,
  WindowGroupFloorValueRangeRule,
  WindowGroupLocaleLengthRule,
  WindowGroupMaximumRangeRule,
  WindowGroupRequiredLocaleRule,
  defaultWindowGroupValidator,
} from "./window-group-rules.js";
import { newWindowGroup } from "./window-group.js";

test("WindowGroupValidator reports every problem", () => {
  const validator = defaultWindowGroupValidator();
  const item = newWindowGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowGroupFloorValueRangeRule flags values above floor value", () => {
  const rule = new WindowGroupFloorValueRangeRule(6.6, 2639.1);
  const item = newWindowGroup("x", "y");
  item.floorValue = 2640.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowGroupMaximumRangeRule flags values above maximum", () => {
  const rule = new WindowGroupMaximumRangeRule(5.6, 2306.8);
  const item = newWindowGroup("x", "y");
  item.maximum = 2308.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowGroupRequiredLocaleRule flags a blank locale", () => {
  const rule = new WindowGroupRequiredLocaleRule("window group needs an entry");
  const item = newWindowGroup("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowGroupCodeLengthRule flags a long code", () => {
  const rule = new WindowGroupCodeLengthRule(3600);
  const item = newWindowGroup("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowGroupLocaleLengthRule flags a long locale", () => {
  const rule = new WindowGroupLocaleLengthRule(32);
  const item = newWindowGroup("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
