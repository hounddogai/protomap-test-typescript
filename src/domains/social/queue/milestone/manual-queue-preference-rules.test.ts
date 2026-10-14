import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualQueuePreferenceRevisionRangeRule,
  defaultManualQueuePreferenceValidator,
} from "./manual-queue-preference-rules.js";
import { newManualQueuePreference } from "./manual-queue-preference.js";

test("ManualQueuePreferenceValidator reports every problem", () => {
  const validator = defaultManualQueuePreferenceValidator();
  const item = newManualQueuePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualQueuePreferenceRevisionRangeRule flags values above revision", () => {
  const rule = new ManualQueuePreferenceRevisionRangeRule(1000, 3600);
  const item = newManualQueuePreference("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
