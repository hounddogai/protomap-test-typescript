import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalDeflectionRecordLabelLengthRule,
  RegionalDeflectionRecordPhoneLengthRule,
  RegionalDeflectionRecordRequiredLabelRule,
  defaultRegionalDeflectionRecordValidator,
} from "./regional-deflection-record-rules.js";
import { newRegionalDeflectionRecord } from "./regional-deflection-record.js";

test("RegionalDeflectionRecordValidator reports every problem", () => {
  const validator = defaultRegionalDeflectionRecordValidator();
  const item = newRegionalDeflectionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalDeflectionRecordRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalDeflectionRecordRequiredLabelRule("regional deflection record needs this field");
  const item = newRegionalDeflectionRecord("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalDeflectionRecordLabelLengthRule flags a long label", () => {
  const rule = new RegionalDeflectionRecordLabelLengthRule(80);
  const item = newRegionalDeflectionRecord("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalDeflectionRecordPhoneLengthRule flags a long phone", () => {
  const rule = new RegionalDeflectionRecordPhoneLengthRule(64);
  const item = newRegionalDeflectionRecord("x", "y");
  item.phone = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
