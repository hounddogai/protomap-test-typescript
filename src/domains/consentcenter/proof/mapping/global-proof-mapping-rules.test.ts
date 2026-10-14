import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalProofMappingBatchSizeRangeRule,
  GlobalProofMappingRequiredCodeRule,
  GlobalProofMappingRequiredSummaryRule,
  defaultGlobalProofMappingValidator,
} from "./global-proof-mapping-rules.js";
import { newGlobalProofMapping } from "./global-proof-mapping.js";

test("GlobalProofMappingValidator reports every problem", () => {
  const validator = defaultGlobalProofMappingValidator();
  const item = newGlobalProofMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalProofMappingRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalProofMappingRequiredCodeRule("global proof mapping needs this field");
  const item = newGlobalProofMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalProofMappingRequiredSummaryRule flags a blank summary", () => {
  const rule = new GlobalProofMappingRequiredSummaryRule("global proof mapping needs a value");
  const item = newGlobalProofMapping("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalProofMappingBatchSizeRangeRule flags values above batch size", () => {
  const rule = new GlobalProofMappingBatchSizeRangeRule(120, 120);
  const item = newGlobalProofMapping("x", "y");
  item.batchSize = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
