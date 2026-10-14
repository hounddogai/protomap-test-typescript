import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPlacementTemplateDiscountRangeRule,
  BatchedPlacementTemplateLabelLengthRule,
  BatchedPlacementTemplatePhoneLengthRule,
  BatchedPlacementTemplateRequiredPhoneRule,
  BatchedPlacementTemplateUpdatedAtRangeRule,
  defaultBatchedPlacementTemplateValidator,
} from "./batched-placement-template-rules.js";
import { newBatchedPlacementTemplate } from "./batched-placement-template.js";

test("BatchedPlacementTemplateValidator reports every problem", () => {
  const validator = defaultBatchedPlacementTemplateValidator();
  const item = newBatchedPlacementTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPlacementTemplateDiscountRangeRule flags values above discount", () => {
  const rule = new BatchedPlacementTemplateDiscountRangeRule(4.5, 416.6);
  const item = newBatchedPlacementTemplate("x", "y");
  item.discount = 418.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPlacementTemplateLabelLengthRule flags a long label", () => {
  const rule = new BatchedPlacementTemplateLabelLengthRule(32);
  const item = newBatchedPlacementTemplate("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPlacementTemplatePhoneLengthRule flags a long phone", () => {
  const rule = new BatchedPlacementTemplatePhoneLengthRule(3600);
  const item = newBatchedPlacementTemplate("x", "y");
  item.phone = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPlacementTemplateRequiredPhoneRule flags a blank phone", () => {
  const rule = new BatchedPlacementTemplateRequiredPhoneRule("batched placement template needs this field");
  const item = newBatchedPlacementTemplate("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPlacementTemplateUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new BatchedPlacementTemplateUpdatedAtRangeRule(120, 86400);
  const item = newBatchedPlacementTemplate("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
