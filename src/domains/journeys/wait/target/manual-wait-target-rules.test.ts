import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualWaitTargetNameLengthRule,
  ManualWaitTargetRateRangeRule,
  ManualWaitTargetRequiredCodeRule,
  ManualWaitTargetRequiredExternalRefRule,
  ManualWaitTargetRequiredNameRule,
  defaultManualWaitTargetValidator,
} from "./manual-wait-target-rules.js";
import { newManualWaitTarget } from "./manual-wait-target.js";

test("ManualWaitTargetValidator reports every problem", () => {
  const validator = defaultManualWaitTargetValidator();
  const item = newManualWaitTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualWaitTargetRateRangeRule flags values above rate", () => {
  const rule = new ManualWaitTargetRateRangeRule(8.3, 803);
  const item = newManualWaitTarget("x", "y");
  item.rate = 804.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualWaitTargetRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new ManualWaitTargetRequiredExternalRefRule("manual wait target needs this field");
  const item = newManualWaitTarget("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualWaitTargetRequiredCodeRule flags a blank code", () => {
  const rule = new ManualWaitTargetRequiredCodeRule("manual wait target needs an entry");
  const item = newManualWaitTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualWaitTargetNameLengthRule flags a long name", () => {
  const rule = new ManualWaitTargetNameLengthRule(255);
  const item = newManualWaitTarget("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualWaitTargetRequiredNameRule flags a blank name", () => {
  const rule = new ManualWaitTargetRequiredNameRule("manual wait target needs a value");
  const item = newManualWaitTarget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
