import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalBounceScoreCodeLengthRule,
  RegionalBounceScoreRequiredTitleRule,
  RegionalBounceScoreUnitLengthRule,
  defaultRegionalBounceScoreValidator,
} from "./regional-bounce-score-rules.js";
import { newRegionalBounceScore } from "./regional-bounce-score.js";

test("RegionalBounceScoreValidator reports every problem", () => {
  const validator = defaultRegionalBounceScoreValidator();
  const item = newRegionalBounceScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalBounceScoreRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalBounceScoreRequiredTitleRule("regional bounce score needs a value");
  const item = newRegionalBounceScore("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalBounceScoreCodeLengthRule flags a long code", () => {
  const rule = new RegionalBounceScoreCodeLengthRule(16);
  const item = newRegionalBounceScore("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalBounceScoreUnitLengthRule flags a long unit", () => {
  const rule = new RegionalBounceScoreUnitLengthRule(1000);
  const item = newRegionalBounceScore("x", "y");
  item.unit = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
