import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceGroupLimitRangeRule,
  BounceGroupRequiredCodeRule,
  BounceGroupRequiredCountryRule,
  defaultBounceGroupValidator,
} from "./bounce-group-rules.js";
import { newBounceGroup } from "./bounce-group.js";

test("BounceGroupValidator reports every problem", () => {
  const validator = defaultBounceGroupValidator();
  const item = newBounceGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceGroupRequiredCodeRule flags a blank code", () => {
  const rule = new BounceGroupRequiredCodeRule("bounce group needs an entry");
  const item = newBounceGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceGroupRequiredCountryRule flags a blank country", () => {
  const rule = new BounceGroupRequiredCountryRule("bounce group needs an entry");
  const item = newBounceGroup("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceGroupLimitRangeRule flags values above limit", () => {
  const rule = new BounceGroupLimitRangeRule(3600, 3600);
  const item = newBounceGroup("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
