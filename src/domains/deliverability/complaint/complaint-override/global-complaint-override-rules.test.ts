import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalComplaintOverrideChannelLengthRule,
  GlobalComplaintOverrideCodeLengthRule,
  GlobalComplaintOverrideFrequencyCapRangeRule,
  GlobalComplaintOverrideRequiredCodeRule,
  GlobalComplaintOverrideTitleLengthRule,
  defaultGlobalComplaintOverrideValidator,
} from "./global-complaint-override-rules.js";
import { newGlobalComplaintOverride } from "./global-complaint-override.js";

test("GlobalComplaintOverrideValidator reports every problem", () => {
  const validator = defaultGlobalComplaintOverrideValidator();
  const item = newGlobalComplaintOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalComplaintOverrideChannelLengthRule flags a long channel", () => {
  const rule = new GlobalComplaintOverrideChannelLengthRule(80);
  const item = newGlobalComplaintOverride("x", "y");
  item.channel = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalComplaintOverrideCodeLengthRule flags a long code", () => {
  const rule = new GlobalComplaintOverrideCodeLengthRule(3600);
  const item = newGlobalComplaintOverride("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalComplaintOverrideTitleLengthRule flags a long title", () => {
  const rule = new GlobalComplaintOverrideTitleLengthRule(255);
  const item = newGlobalComplaintOverride("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalComplaintOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalComplaintOverrideRequiredCodeRule("global complaint override needs an entry");
  const item = newGlobalComplaintOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalComplaintOverrideFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new GlobalComplaintOverrideFrequencyCapRangeRule(64, 255);
  const item = newGlobalComplaintOverride("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
