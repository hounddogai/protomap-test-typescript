import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientComplaintOverrideClicksRangeRule,
  LenientComplaintOverrideNameLengthRule,
  LenientComplaintOverrideRequiredNameRule,
  defaultLenientComplaintOverrideValidator,
} from "./lenient-complaint-override-rules.js";
import { newLenientComplaintOverride } from "./lenient-complaint-override.js";

test("LenientComplaintOverrideValidator reports every problem", () => {
  const validator = defaultLenientComplaintOverrideValidator();
  const item = newLenientComplaintOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientComplaintOverrideClicksRangeRule flags values above clicks", () => {
  const rule = new LenientComplaintOverrideClicksRangeRule(32, 3600);
  const item = newLenientComplaintOverride("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientComplaintOverrideNameLengthRule flags a long name", () => {
  const rule = new LenientComplaintOverrideNameLengthRule(120);
  const item = newLenientComplaintOverride("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientComplaintOverrideRequiredNameRule flags a blank name", () => {
  const rule = new LenientComplaintOverrideRequiredNameRule("lenient complaint override needs a value");
  const item = newLenientComplaintOverride("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
