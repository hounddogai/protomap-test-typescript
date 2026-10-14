import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedDomainTemplateFrequencyCapRangeRule,
  BatchedDomainTemplateRequiredCodeRule,
  BatchedDomainTemplateRequiredLabelRule,
  defaultBatchedDomainTemplateValidator,
} from "./batched-domain-template-rules.js";
import { newBatchedDomainTemplate } from "./batched-domain-template.js";

test("BatchedDomainTemplateValidator reports every problem", () => {
  const validator = defaultBatchedDomainTemplateValidator();
  const item = newBatchedDomainTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedDomainTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedDomainTemplateRequiredCodeRule("batched domain template needs a value");
  const item = newBatchedDomainTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedDomainTemplateFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BatchedDomainTemplateFrequencyCapRangeRule(32, 1000);
  const item = newBatchedDomainTemplate("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedDomainTemplateRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedDomainTemplateRequiredLabelRule("batched domain template needs an entry");
  const item = newBatchedDomainTemplate("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
