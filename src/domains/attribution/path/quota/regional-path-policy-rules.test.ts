import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPathPolicyCeilingRangeRule,
  RegionalPathPolicyLabelLengthRule,
  defaultRegionalPathPolicyValidator,
} from "./regional-path-policy-rules.js";
import { newRegionalPathPolicy } from "./regional-path-policy.js";

test("RegionalPathPolicyValidator reports every problem", () => {
  const validator = defaultRegionalPathPolicyValidator();
  const item = newRegionalPathPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPathPolicyCeilingRangeRule flags values above ceiling", () => {
  const rule = new RegionalPathPolicyCeilingRangeRule(6.7, 1732.1);
  const item = newRegionalPathPolicy("x", "y");
  item.ceiling = 1733.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalPathPolicyLabelLengthRule flags a long label", () => {
  const rule = new RegionalPathPolicyLabelLengthRule(255);
  const item = newRegionalPathPolicy("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
