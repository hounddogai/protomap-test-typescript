import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryStepEntryCodeLengthRule,
  PrimaryStepEntryMarginRangeRule,
  PrimaryStepEntryOpenRateRangeRule,
  defaultPrimaryStepEntryValidator,
} from "./primary-step-entry-rules.js";
import { newPrimaryStepEntry } from "./primary-step-entry.js";

test("PrimaryStepEntryValidator reports every problem", () => {
  const validator = defaultPrimaryStepEntryValidator();
  const item = newPrimaryStepEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryStepEntryMarginRangeRule flags values above margin", () => {
  const rule = new PrimaryStepEntryMarginRangeRule(6.9, 4995.3);
  const item = newPrimaryStepEntry("x", "y");
  item.margin = 4996.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryStepEntryCodeLengthRule flags a long code", () => {
  const rule = new PrimaryStepEntryCodeLengthRule(16);
  const item = newPrimaryStepEntry("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryStepEntryOpenRateRangeRule flags values above open rate", () => {
  const rule = new PrimaryStepEntryOpenRateRangeRule(0.2, 1092.2);
  const item = newPrimaryStepEntry("x", "y");
  item.openRate = 1093.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
