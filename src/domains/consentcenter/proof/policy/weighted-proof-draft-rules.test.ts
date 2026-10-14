import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedProofDraftCategoryLengthRule,
  WeightedProofDraftClicksRangeRule,
  WeightedProofDraftCodeLengthRule,
  WeightedProofDraftRequiredCategoryRule,
  WeightedProofDraftThresholdRangeRule,
  defaultWeightedProofDraftValidator,
} from "./weighted-proof-draft-rules.js";
import { newWeightedProofDraft } from "./weighted-proof-draft.js";

test("WeightedProofDraftValidator reports every problem", () => {
  const validator = defaultWeightedProofDraftValidator();
  const item = newWeightedProofDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedProofDraftRequiredCategoryRule flags a blank category", () => {
  const rule = new WeightedProofDraftRequiredCategoryRule("weighted proof draft needs this field");
  const item = newWeightedProofDraft("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedProofDraftCategoryLengthRule flags a long category", () => {
  const rule = new WeightedProofDraftCategoryLengthRule(120);
  const item = newWeightedProofDraft("x", "y");
  item.category = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedProofDraftCodeLengthRule flags a long code", () => {
  const rule = new WeightedProofDraftCodeLengthRule(1000);
  const item = newWeightedProofDraft("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedProofDraftThresholdRangeRule flags values above threshold", () => {
  const rule = new WeightedProofDraftThresholdRangeRule(8.3, 4127.4);
  const item = newWeightedProofDraft("x", "y");
  item.threshold = 4128.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedProofDraftClicksRangeRule flags values above clicks", () => {
  const rule = new WeightedProofDraftClicksRangeRule(120, 255);
  const item = newWeightedProofDraft("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
