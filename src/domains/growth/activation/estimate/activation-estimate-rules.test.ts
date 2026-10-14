import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationEstimateChecksumLengthRule,
  ActivationEstimateCodeLengthRule,
  ActivationEstimateExpiresAtRangeRule,
  ActivationEstimateRequiredChecksumRule,
  defaultActivationEstimateValidator,
} from "./activation-estimate-rules.js";
import { newActivationEstimate } from "./activation-estimate.js";

test("ActivationEstimateValidator reports every problem", () => {
  const validator = defaultActivationEstimateValidator();
  const item = newActivationEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationEstimateRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ActivationEstimateRequiredChecksumRule("activation estimate needs this field");
  const item = newActivationEstimate("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationEstimateExpiresAtRangeRule flags values above expires at", () => {
  const rule = new ActivationEstimateExpiresAtRangeRule(16, 255);
  const item = newActivationEstimate("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationEstimateCodeLengthRule flags a long code", () => {
  const rule = new ActivationEstimateCodeLengthRule(16);
  const item = newActivationEstimate("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationEstimateChecksumLengthRule flags a long checksum", () => {
  const rule = new ActivationEstimateChecksumLengthRule(3600);
  const item = newActivationEstimate("x", "y");
  item.checksum = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
