import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPaywallTemplateGraceDaysRangeRule,
  BatchedPaywallTemplateTitleLengthRule,
  defaultBatchedPaywallTemplateValidator,
} from "./batched-paywall-template-rules.js";
import { newBatchedPaywallTemplate } from "./batched-paywall-template.js";

test("BatchedPaywallTemplateValidator reports every problem", () => {
  const validator = defaultBatchedPaywallTemplateValidator();
  const item = newBatchedPaywallTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPaywallTemplateTitleLengthRule flags a long title", () => {
  const rule = new BatchedPaywallTemplateTitleLengthRule(1000);
  const item = newBatchedPaywallTemplate("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPaywallTemplateGraceDaysRangeRule flags values above grace days", () => {
  const rule = new BatchedPaywallTemplateGraceDaysRangeRule(64, 1000);
  const item = newBatchedPaywallTemplate("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
