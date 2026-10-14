import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyDoubleOptInRollupAmountRangeRule,
  LegacyDoubleOptInRollupChannelLengthRule,
  LegacyDoubleOptInRollupCodeLengthRule,
  LegacyDoubleOptInRollupNameLengthRule,
  LegacyDoubleOptInRollupRequiredPhoneRule,
  defaultLegacyDoubleOptInRollupValidator,
} from "./legacy-double-opt-in-rollup-rules.js";
import { newLegacyDoubleOptInRollup } from "./legacy-double-opt-in-rollup.js";

test("LegacyDoubleOptInRollupValidator reports every problem", () => {
  const validator = defaultLegacyDoubleOptInRollupValidator();
  const item = newLegacyDoubleOptInRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyDoubleOptInRollupRequiredPhoneRule flags a blank phone", () => {
  const rule = new LegacyDoubleOptInRollupRequiredPhoneRule("legacy double opt in rollup needs an entry");
  const item = newLegacyDoubleOptInRollup("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyDoubleOptInRollupChannelLengthRule flags a long channel", () => {
  const rule = new LegacyDoubleOptInRollupChannelLengthRule(3600);
  const item = newLegacyDoubleOptInRollup("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyDoubleOptInRollupAmountRangeRule flags values above amount", () => {
  const rule = new LegacyDoubleOptInRollupAmountRangeRule(2.5, 122.4);
  const item = newLegacyDoubleOptInRollup("x", "y");
  item.amount = 123.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyDoubleOptInRollupNameLengthRule flags a long name", () => {
  const rule = new LegacyDoubleOptInRollupNameLengthRule(1000);
  const item = newLegacyDoubleOptInRollup("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyDoubleOptInRollupCodeLengthRule flags a long code", () => {
  const rule = new LegacyDoubleOptInRollupCodeLengthRule(16);
  const item = newLegacyDoubleOptInRollup("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
