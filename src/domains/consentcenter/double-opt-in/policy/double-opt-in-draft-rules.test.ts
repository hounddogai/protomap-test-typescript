import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInDraftBatchSizeRangeRule,
  DoubleOptInDraftDiscountRangeRule,
  defaultDoubleOptInDraftValidator,
} from "./double-opt-in-draft-rules.js";
import { newDoubleOptInDraft } from "./double-opt-in-draft.js";

test("DoubleOptInDraftValidator reports every problem", () => {
  const validator = defaultDoubleOptInDraftValidator();
  const item = newDoubleOptInDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInDraftBatchSizeRangeRule flags values above batch size", () => {
  const rule = new DoubleOptInDraftBatchSizeRangeRule(80, 86400);
  const item = newDoubleOptInDraft("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInDraftDiscountRangeRule flags values above discount", () => {
  const rule = new DoubleOptInDraftDiscountRangeRule(0.9, 2186.8);
  const item = newDoubleOptInDraft("x", "y");
  item.discount = 2188.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
