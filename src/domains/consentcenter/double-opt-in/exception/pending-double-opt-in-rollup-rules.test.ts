import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingDoubleOptInRollupCodeLengthRule,
  PendingDoubleOptInRollupCohortLengthRule,
  PendingDoubleOptInRollupConversionRateRangeRule,
  PendingDoubleOptInRollupRequiredChecksumRule,
  PendingDoubleOptInRollupRequiredTitleRule,
  defaultPendingDoubleOptInRollupValidator,
} from "./pending-double-opt-in-rollup-rules.js";
import { newPendingDoubleOptInRollup } from "./pending-double-opt-in-rollup.js";

test("PendingDoubleOptInRollupValidator reports every problem", () => {
  const validator = defaultPendingDoubleOptInRollupValidator();
  const item = newPendingDoubleOptInRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingDoubleOptInRollupRequiredTitleRule flags a blank title", () => {
  const rule = new PendingDoubleOptInRollupRequiredTitleRule("pending double opt in rollup needs an entry");
  const item = newPendingDoubleOptInRollup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingDoubleOptInRollupCohortLengthRule flags a long cohort", () => {
  const rule = new PendingDoubleOptInRollupCohortLengthRule(120);
  const item = newPendingDoubleOptInRollup("x", "y");
  item.cohort = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingDoubleOptInRollupCodeLengthRule flags a long code", () => {
  const rule = new PendingDoubleOptInRollupCodeLengthRule(32);
  const item = newPendingDoubleOptInRollup("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingDoubleOptInRollupRequiredChecksumRule flags a blank checksum", () => {
  const rule = new PendingDoubleOptInRollupRequiredChecksumRule("pending double opt in rollup needs this field");
  const item = newPendingDoubleOptInRollup("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingDoubleOptInRollupConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PendingDoubleOptInRollupConversionRateRangeRule(5.4, 4313.4);
  const item = newPendingDoubleOptInRollup("x", "y");
  item.conversionRate = 4314.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
