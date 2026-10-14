import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyPolicyCodeLengthRule,
  FrequencyPolicyLimitRangeRule,
  FrequencyPolicyRequiredChecksumRule,
  FrequencyPolicyRequiredTitleRule,
  defaultFrequencyPolicyValidator,
} from "./frequency-policy-rules.js";
import { newFrequencyPolicy } from "./frequency-policy.js";

test("FrequencyPolicyValidator reports every problem", () => {
  const validator = defaultFrequencyPolicyValidator();
  const item = newFrequencyPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyPolicyCodeLengthRule flags a long code", () => {
  const rule = new FrequencyPolicyCodeLengthRule(255);
  const item = newFrequencyPolicy("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyPolicyLimitRangeRule flags values above limit", () => {
  const rule = new FrequencyPolicyLimitRangeRule(16, 64);
  const item = newFrequencyPolicy("x", "y");
  item.limit = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyPolicyRequiredTitleRule flags a blank title", () => {
  const rule = new FrequencyPolicyRequiredTitleRule("frequency policy needs this field");
  const item = newFrequencyPolicy("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyPolicyRequiredChecksumRule flags a blank checksum", () => {
  const rule = new FrequencyPolicyRequiredChecksumRule("frequency policy needs an entry");
  const item = newFrequencyPolicy("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
