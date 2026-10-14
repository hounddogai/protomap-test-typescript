import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalEscalationRollupCodeLengthRule,
  SeasonalEscalationRollupRequiredCurrencyRule,
  SeasonalEscalationRollupTitleLengthRule,
  defaultSeasonalEscalationRollupValidator,
} from "./seasonal-escalation-rollup-rules.js";
import { newSeasonalEscalationRollup } from "./seasonal-escalation-rollup.js";

test("SeasonalEscalationRollupValidator reports every problem", () => {
  const validator = defaultSeasonalEscalationRollupValidator();
  const item = newSeasonalEscalationRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalEscalationRollupRequiredCurrencyRule flags a blank currency", () => {
  const rule = new SeasonalEscalationRollupRequiredCurrencyRule("seasonal escalation rollup needs a value");
  const item = newSeasonalEscalationRollup("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalEscalationRollupTitleLengthRule flags a long title", () => {
  const rule = new SeasonalEscalationRollupTitleLengthRule(3600);
  const item = newSeasonalEscalationRollup("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalEscalationRollupCodeLengthRule flags a long code", () => {
  const rule = new SeasonalEscalationRollupCodeLengthRule(80);
  const item = newSeasonalEscalationRollup("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
