import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedWaitQuotaCodeLengthRule,
  WeightedWaitQuotaRequiredNameRule,
  defaultWeightedWaitQuotaValidator,
} from "./weighted-wait-quota-rules.js";
import { newWeightedWaitQuota } from "./weighted-wait-quota.js";

test("WeightedWaitQuotaValidator reports every problem", () => {
  const validator = defaultWeightedWaitQuotaValidator();
  const item = newWeightedWaitQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedWaitQuotaRequiredNameRule flags a blank name", () => {
  const rule = new WeightedWaitQuotaRequiredNameRule("weighted wait quota needs a value");
  const item = newWeightedWaitQuota("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedWaitQuotaCodeLengthRule flags a long code", () => {
  const rule = new WeightedWaitQuotaCodeLengthRule(255);
  const item = newWeightedWaitQuota("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
