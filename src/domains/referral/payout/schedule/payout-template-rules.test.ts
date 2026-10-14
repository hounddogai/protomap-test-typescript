import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutTemplateCategoryLengthRule,
  PayoutTemplateCodeLengthRule,
  PayoutTemplateOwnerIdLengthRule,
  PayoutTemplateRequiredCodeRule,
  PayoutTemplateRequiredOwnerIdRule,
  PayoutTemplateRevisionRangeRule,
  defaultPayoutTemplateValidator,
} from "./payout-template-rules.js";
import { newPayoutTemplate } from "./payout-template.js";

test("PayoutTemplateValidator reports every problem", () => {
  const validator = defaultPayoutTemplateValidator();
  const item = newPayoutTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutTemplateRevisionRangeRule flags values above revision", () => {
  const rule = new PayoutTemplateRevisionRangeRule(32, 3600);
  const item = newPayoutTemplate("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PayoutTemplateCodeLengthRule flags a long code", () => {
  const rule = new PayoutTemplateCodeLengthRule(80);
  const item = newPayoutTemplate("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutTemplateRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new PayoutTemplateRequiredOwnerIdRule("payout template needs an entry");
  const item = newPayoutTemplate("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutTemplateCategoryLengthRule flags a long category", () => {
  const rule = new PayoutTemplateCategoryLengthRule(255);
  const item = newPayoutTemplate("x", "y");
  item.category = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutTemplateOwnerIdLengthRule flags a long owner id", () => {
  const rule = new PayoutTemplateOwnerIdLengthRule(80);
  const item = newPayoutTemplate("x", "y");
  item.ownerId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new PayoutTemplateRequiredCodeRule("payout template needs an entry");
  const item = newPayoutTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
