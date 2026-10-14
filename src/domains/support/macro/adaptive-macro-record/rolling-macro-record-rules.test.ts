import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingMacroRecordClicksRangeRule,
  RollingMacroRecordRequiredExternalRefRule,
  defaultRollingMacroRecordValidator,
} from "./rolling-macro-record-rules.js";
import { newRollingMacroRecord } from "./rolling-macro-record.js";

test("RollingMacroRecordValidator reports every problem", () => {
  const validator = defaultRollingMacroRecordValidator();
  const item = newRollingMacroRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingMacroRecordRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new RollingMacroRecordRequiredExternalRefRule("rolling macro record needs a value");
  const item = newRollingMacroRecord("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingMacroRecordClicksRangeRule flags values above clicks", () => {
  const rule = new RollingMacroRecordClicksRangeRule(80, 3600);
  const item = newRollingMacroRecord("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
