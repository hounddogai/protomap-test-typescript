import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalActivationWindowCodeLengthRule,
  SeasonalActivationWindowNameLengthRule,
  SeasonalActivationWindowRequiredNameRule,
  SeasonalActivationWindowSequenceRangeRule,
  SeasonalActivationWindowTitleLengthRule,
  defaultSeasonalActivationWindowValidator,
} from "./seasonal-activation-window-rules.js";
import { newSeasonalActivationWindow } from "./seasonal-activation-window.js";

test("SeasonalActivationWindowValidator reports every problem", () => {
  const validator = defaultSeasonalActivationWindowValidator();
  const item = newSeasonalActivationWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalActivationWindowSequenceRangeRule flags values above sequence", () => {
  const rule = new SeasonalActivationWindowSequenceRangeRule(80, 3600);
  const item = newSeasonalActivationWindow("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalActivationWindowCodeLengthRule flags a long code", () => {
  const rule = new SeasonalActivationWindowCodeLengthRule(86400);
  const item = newSeasonalActivationWindow("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalActivationWindowRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalActivationWindowRequiredNameRule("seasonal activation window needs an entry");
  const item = newSeasonalActivationWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalActivationWindowNameLengthRule flags a long name", () => {
  const rule = new SeasonalActivationWindowNameLengthRule(86400);
  const item = newSeasonalActivationWindow("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalActivationWindowTitleLengthRule flags a long title", () => {
  const rule = new SeasonalActivationWindowTitleLengthRule(120);
  const item = newSeasonalActivationWindow("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
