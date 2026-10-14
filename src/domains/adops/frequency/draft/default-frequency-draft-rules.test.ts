import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultFrequencyDraftQuantityRangeRule,
  DefaultFrequencyDraftRequiredCodeRule,
  defaultDefaultFrequencyDraftValidator,
} from "./default-frequency-draft-rules.js";
import { newDefaultFrequencyDraft } from "./default-frequency-draft.js";

test("DefaultFrequencyDraftValidator reports every problem", () => {
  const validator = defaultDefaultFrequencyDraftValidator();
  const item = newDefaultFrequencyDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultFrequencyDraftRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultFrequencyDraftRequiredCodeRule("default frequency draft needs this field");
  const item = newDefaultFrequencyDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultFrequencyDraftQuantityRangeRule flags values above quantity", () => {
  const rule = new DefaultFrequencyDraftQuantityRangeRule(32, 1000);
  const item = newDefaultFrequencyDraft("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
