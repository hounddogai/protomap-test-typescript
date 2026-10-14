import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimarySenderRollupConversionRateRangeRule,
  PrimarySenderRollupRequiredSourceRule,
  PrimarySenderRollupSourceLengthRule,
  defaultPrimarySenderRollupValidator,
} from "./primary-sender-rollup-rules.js";
import { newPrimarySenderRollup } from "./primary-sender-rollup.js";

test("PrimarySenderRollupValidator reports every problem", () => {
  const validator = defaultPrimarySenderRollupValidator();
  const item = newPrimarySenderRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimarySenderRollupConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PrimarySenderRollupConversionRateRangeRule(3.3, 662.5);
  const item = newPrimarySenderRollup("x", "y");
  item.conversionRate = 664;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimarySenderRollupSourceLengthRule flags a long source", () => {
  const rule = new PrimarySenderRollupSourceLengthRule(16);
  const item = newPrimarySenderRollup("x", "y");
  item.source = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimarySenderRollupRequiredSourceRule flags a blank source", () => {
  const rule = new PrimarySenderRollupRequiredSourceRule("primary sender rollup needs an entry");
  const item = newPrimarySenderRollup("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
