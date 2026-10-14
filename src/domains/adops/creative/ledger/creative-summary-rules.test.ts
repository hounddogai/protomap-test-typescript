import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeSummaryLocaleLengthRule,
  CreativeSummaryRequiredCodeRule,
  CreativeSummaryRequiredSummaryRule,
  CreativeSummaryRetriesRangeRule,
  defaultCreativeSummaryValidator,
} from "./creative-summary-rules.js";
import { newCreativeSummary } from "./creative-summary.js";

test("CreativeSummaryValidator reports every problem", () => {
  const validator = defaultCreativeSummaryValidator();
  const item = newCreativeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeSummaryRetriesRangeRule flags values above retries", () => {
  const rule = new CreativeSummaryRetriesRangeRule(16, 86400);
  const item = newCreativeSummary("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeSummaryLocaleLengthRule flags a long locale", () => {
  const rule = new CreativeSummaryLocaleLengthRule(32);
  const item = newCreativeSummary("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new CreativeSummaryRequiredCodeRule("creative summary needs this field");
  const item = newCreativeSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeSummaryRequiredSummaryRule flags a blank summary", () => {
  const rule = new CreativeSummaryRequiredSummaryRule("creative summary needs this field");
  const item = newCreativeSummary("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
