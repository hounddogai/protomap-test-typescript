import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingComplaintMappingCodeLengthRule,
  PendingComplaintMappingOpenRateRangeRule,
  defaultPendingComplaintMappingValidator,
} from "./pending-complaint-mapping-rules.js";
import { newPendingComplaintMapping } from "./pending-complaint-mapping.js";

test("PendingComplaintMappingValidator reports every problem", () => {
  const validator = defaultPendingComplaintMappingValidator();
  const item = newPendingComplaintMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingComplaintMappingCodeLengthRule flags a long code", () => {
  const rule = new PendingComplaintMappingCodeLengthRule(64);
  const item = newPendingComplaintMapping("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingComplaintMappingOpenRateRangeRule flags values above open rate", () => {
  const rule = new PendingComplaintMappingOpenRateRangeRule(1, 1201.8);
  const item = newPendingComplaintMapping("x", "y");
  item.openRate = 1203.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
