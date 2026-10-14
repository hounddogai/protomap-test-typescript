import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedFraudCheckMappingChecksumLengthRule,
  CappedFraudCheckMappingRateRangeRule,
  defaultCappedFraudCheckMappingValidator,
} from "./capped-fraud-check-mapping-rules.js";
import { newCappedFraudCheckMapping } from "./capped-fraud-check-mapping.js";

test("CappedFraudCheckMappingValidator reports every problem", () => {
  const validator = defaultCappedFraudCheckMappingValidator();
  const item = newCappedFraudCheckMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedFraudCheckMappingRateRangeRule flags values above rate", () => {
  const rule = new CappedFraudCheckMappingRateRangeRule(0, 688.4);
  const item = newCappedFraudCheckMapping("x", "y");
  item.rate = 689.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedFraudCheckMappingChecksumLengthRule flags a long checksum", () => {
  const rule = new CappedFraudCheckMappingChecksumLengthRule(120);
  const item = newCappedFraudCheckMapping("x", "y");
  item.checksum = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
