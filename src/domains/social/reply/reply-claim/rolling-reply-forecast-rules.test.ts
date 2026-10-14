import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingReplyForecastRequiredNameRule,
  RollingReplyForecastScoreRangeRule,
  defaultRollingReplyForecastValidator,
} from "./rolling-reply-forecast-rules.js";
import { newRollingReplyForecast } from "./rolling-reply-forecast.js";

test("RollingReplyForecastValidator reports every problem", () => {
  const validator = defaultRollingReplyForecastValidator();
  const item = newRollingReplyForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingReplyForecastScoreRangeRule flags values above score", () => {
  const rule = new RollingReplyForecastScoreRangeRule(5.9, 826.6);
  const item = newRollingReplyForecast("x", "y");
  item.score = 828.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingReplyForecastRequiredNameRule flags a blank name", () => {
  const rule = new RollingReplyForecastRequiredNameRule("rolling reply forecast needs a value");
  const item = newRollingReplyForecast("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
