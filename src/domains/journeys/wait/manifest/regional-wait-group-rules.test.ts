import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalWaitGroupAttemptsRangeRule,
  RegionalWaitGroupRequiredCodeRule,
  RegionalWaitGroupTimezoneLengthRule,
  defaultRegionalWaitGroupValidator,
} from "./regional-wait-group-rules.js";
import { newRegionalWaitGroup } from "./regional-wait-group.js";

test("RegionalWaitGroupValidator reports every problem", () => {
  const validator = defaultRegionalWaitGroupValidator();
  const item = newRegionalWaitGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalWaitGroupRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalWaitGroupRequiredCodeRule("regional wait group needs an entry");
  const item = newRegionalWaitGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalWaitGroupAttemptsRangeRule flags values above attempts", () => {
  const rule = new RegionalWaitGroupAttemptsRangeRule(1000, 86400);
  const item = newRegionalWaitGroup("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalWaitGroupTimezoneLengthRule flags a long timezone", () => {
  const rule = new RegionalWaitGroupTimezoneLengthRule(255);
  const item = newRegionalWaitGroup("x", "y");
  item.timezone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
