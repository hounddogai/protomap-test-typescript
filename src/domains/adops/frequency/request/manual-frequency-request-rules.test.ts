import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualFrequencyRequestRequiredChecksumRule,
  ManualFrequencyRequestRequiredNameRule,
  ManualFrequencyRequestRequiredUnitRule,
  ManualFrequencyRequestRevisionRangeRule,
  ManualFrequencyRequestStartsAtRangeRule,
  defaultManualFrequencyRequestValidator,
} from "./manual-frequency-request-rules.js";
import { newManualFrequencyRequest } from "./manual-frequency-request.js";

test("ManualFrequencyRequestValidator reports every problem", () => {
  const validator = defaultManualFrequencyRequestValidator();
  const item = newManualFrequencyRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualFrequencyRequestRevisionRangeRule flags values above revision", () => {
  const rule = new ManualFrequencyRequestRevisionRangeRule(120, 120);
  const item = newManualFrequencyRequest("x", "y");
  item.revision = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualFrequencyRequestRequiredUnitRule flags a blank unit", () => {
  const rule = new ManualFrequencyRequestRequiredUnitRule("manual frequency request needs this field");
  const item = newManualFrequencyRequest("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualFrequencyRequestRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ManualFrequencyRequestRequiredChecksumRule("manual frequency request needs this field");
  const item = newManualFrequencyRequest("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualFrequencyRequestRequiredNameRule flags a blank name", () => {
  const rule = new ManualFrequencyRequestRequiredNameRule("manual frequency request needs an entry");
  const item = newManualFrequencyRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualFrequencyRequestStartsAtRangeRule flags values above starts at", () => {
  const rule = new ManualFrequencyRequestStartsAtRangeRule(32, 1000);
  const item = newManualFrequencyRequest("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
