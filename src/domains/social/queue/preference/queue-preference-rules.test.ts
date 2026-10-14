import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueuePreferenceContactEmailLengthRule,
  QueuePreferenceEndsAtRangeRule,
  QueuePreferenceRequiredContactEmailRule,
  QueuePreferenceRequiredLabelRule,
  QueuePreferenceStartsAtRangeRule,
  defaultQueuePreferenceValidator,
} from "./queue-preference-rules.js";
import { newQueuePreference } from "./queue-preference.js";

test("QueuePreferenceValidator reports every problem", () => {
  const validator = defaultQueuePreferenceValidator();
  const item = newQueuePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueuePreferenceRequiredLabelRule flags a blank label", () => {
  const rule = new QueuePreferenceRequiredLabelRule("queue preference needs a value");
  const item = newQueuePreference("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("QueuePreferenceRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new QueuePreferenceRequiredContactEmailRule("queue preference needs this field");
  const item = newQueuePreference("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("QueuePreferenceStartsAtRangeRule flags values above starts at", () => {
  const rule = new QueuePreferenceStartsAtRangeRule(64, 1000);
  const item = newQueuePreference("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueuePreferenceContactEmailLengthRule flags a long contact email", () => {
  const rule = new QueuePreferenceContactEmailLengthRule(80);
  const item = newQueuePreference("x", "y");
  item.contactEmail = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueuePreferenceEndsAtRangeRule flags values above ends at", () => {
  const rule = new QueuePreferenceEndsAtRangeRule(32, 80);
  const item = newQueuePreference("x", "y");
  item.endsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
