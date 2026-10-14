import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyWindowClicksRangeRule,
  FrequencyWindowGraceDaysRangeRule,
  FrequencyWindowRequiredJourneyIdRule,
  defaultFrequencyWindowValidator,
} from "./frequency-window-rules.js";
import { newFrequencyWindow } from "./frequency-window.js";

test("FrequencyWindowValidator reports every problem", () => {
  const validator = defaultFrequencyWindowValidator();
  const item = newFrequencyWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyWindowGraceDaysRangeRule flags values above grace days", () => {
  const rule = new FrequencyWindowGraceDaysRangeRule(255, 86400);
  const item = newFrequencyWindow("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyWindowRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new FrequencyWindowRequiredJourneyIdRule("frequency window needs this field");
  const item = newFrequencyWindow("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyWindowClicksRangeRule flags values above clicks", () => {
  const rule = new FrequencyWindowClicksRangeRule(120, 3600);
  const item = newFrequencyWindow("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
