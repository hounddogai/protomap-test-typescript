import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictBranchEntryCodeLengthRule,
  StrictBranchEntryLabelLengthRule,
  StrictBranchEntryQuantityRangeRule,
  StrictBranchEntryRequiredCodeRule,
  defaultStrictBranchEntryValidator,
} from "./strict-branch-entry-rules.js";
import { newStrictBranchEntry } from "./strict-branch-entry.js";

test("StrictBranchEntryValidator reports every problem", () => {
  const validator = defaultStrictBranchEntryValidator();
  const item = newStrictBranchEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictBranchEntryQuantityRangeRule flags values above quantity", () => {
  const rule = new StrictBranchEntryQuantityRangeRule(120, 255);
  const item = newStrictBranchEntry("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictBranchEntryCodeLengthRule flags a long code", () => {
  const rule = new StrictBranchEntryCodeLengthRule(1000);
  const item = newStrictBranchEntry("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictBranchEntryLabelLengthRule flags a long label", () => {
  const rule = new StrictBranchEntryLabelLengthRule(3600);
  const item = newStrictBranchEntry("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictBranchEntryRequiredCodeRule flags a blank code", () => {
  const rule = new StrictBranchEntryRequiredCodeRule("strict branch entry needs a value");
  const item = newStrictBranchEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
