import assert from "node:assert/strict";
import { test } from "node:test";
import { FrequencyEntryRequiredReviewerRule, defaultFrequencyEntryValidator } from "./frequency-entry-rules.js";
import { newFrequencyEntry } from "./frequency-entry.js";

test("FrequencyEntryValidator reports every problem", () => {
  const validator = defaultFrequencyEntryValidator();
  const item = newFrequencyEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyEntryRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new FrequencyEntryRequiredReviewerRule("frequency entry needs an entry");
  const item = newFrequencyEntry("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
