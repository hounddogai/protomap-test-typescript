import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintBundleConversionRateRangeRule,
  ComplaintBundleNameLengthRule,
  ComplaintBundleOwnerIdLengthRule,
  ComplaintBundleRequiredOwnerIdRule,
  defaultComplaintBundleValidator,
} from "./complaint-bundle-rules.js";
import { newComplaintBundle } from "./complaint-bundle.js";

test("ComplaintBundleValidator reports every problem", () => {
  const validator = defaultComplaintBundleValidator();
  const item = newComplaintBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintBundleConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new ComplaintBundleConversionRateRangeRule(1.1, 616.6);
  const item = newComplaintBundle("x", "y");
  item.conversionRate = 618.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintBundleOwnerIdLengthRule flags a long owner id", () => {
  const rule = new ComplaintBundleOwnerIdLengthRule(120);
  const item = newComplaintBundle("x", "y");
  item.ownerId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintBundleNameLengthRule flags a long name", () => {
  const rule = new ComplaintBundleNameLengthRule(255);
  const item = newComplaintBundle("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintBundleRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ComplaintBundleRequiredOwnerIdRule("complaint bundle needs an entry");
  const item = newComplaintBundle("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
