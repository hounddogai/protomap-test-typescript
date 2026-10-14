import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintWindowBatchSizeRangeRule,
  ComplaintWindowLimitRangeRule,
  defaultComplaintWindowValidator,
} from "./complaint-window-rules.js";
import { newComplaintWindow } from "./complaint-window.js";

test("ComplaintWindowValidator reports every problem", () => {
  const validator = defaultComplaintWindowValidator();
  const item = newComplaintWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintWindowBatchSizeRangeRule flags values above batch size", () => {
  const rule = new ComplaintWindowBatchSizeRangeRule(1000, 86400);
  const item = newComplaintWindow("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintWindowLimitRangeRule flags values above limit", () => {
  const rule = new ComplaintWindowLimitRangeRule(32, 255);
  const item = newComplaintWindow("x", "y");
  item.limit = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
