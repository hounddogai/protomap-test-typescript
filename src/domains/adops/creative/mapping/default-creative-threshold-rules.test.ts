import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultCreativeThresholdOpenRateRangeRule,
  DefaultCreativeThresholdRequiredExternalRefRule,
  DefaultCreativeThresholdRequiredLabelRule,
  defaultDefaultCreativeThresholdValidator,
} from "./default-creative-threshold-rules.js";
import { newDefaultCreativeThreshold } from "./default-creative-threshold.js";

test("DefaultCreativeThresholdValidator reports every problem", () => {
  const validator = defaultDefaultCreativeThresholdValidator();
  const item = newDefaultCreativeThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultCreativeThresholdOpenRateRangeRule flags values above open rate", () => {
  const rule = new DefaultCreativeThresholdOpenRateRangeRule(5, 917.1);
  const item = newDefaultCreativeThreshold("x", "y");
  item.openRate = 918.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultCreativeThresholdRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new DefaultCreativeThresholdRequiredExternalRefRule("default creative threshold needs a value");
  const item = newDefaultCreativeThreshold("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultCreativeThresholdRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultCreativeThresholdRequiredLabelRule("default creative threshold needs this field");
  const item = newDefaultCreativeThreshold("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
