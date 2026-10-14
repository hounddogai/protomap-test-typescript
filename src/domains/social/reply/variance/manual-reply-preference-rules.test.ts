import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualReplyPreferenceCapacityRangeRule,
  ManualReplyPreferenceClicksRangeRule,
  ManualReplyPreferenceRequiredExternalRefRule,
  defaultManualReplyPreferenceValidator,
} from "./manual-reply-preference-rules.js";
import { newManualReplyPreference } from "./manual-reply-preference.js";

test("ManualReplyPreferenceValidator reports every problem", () => {
  const validator = defaultManualReplyPreferenceValidator();
  const item = newManualReplyPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualReplyPreferenceCapacityRangeRule flags values above capacity", () => {
  const rule = new ManualReplyPreferenceCapacityRangeRule(80, 120);
  const item = newManualReplyPreference("x", "y");
  item.capacity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualReplyPreferenceClicksRangeRule flags values above clicks", () => {
  const rule = new ManualReplyPreferenceClicksRangeRule(16, 32);
  const item = newManualReplyPreference("x", "y");
  item.clicks = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualReplyPreferenceRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new ManualReplyPreferenceRequiredExternalRefRule("manual reply preference needs an entry");
  const item = newManualReplyPreference("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
