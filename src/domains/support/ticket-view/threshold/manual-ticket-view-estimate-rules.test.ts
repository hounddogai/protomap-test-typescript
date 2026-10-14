import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualTicketViewEstimateCodeLengthRule,
  ManualTicketViewEstimateRatioRangeRule,
  ManualTicketViewEstimateRequiredTitleRule,
  defaultManualTicketViewEstimateValidator,
} from "./manual-ticket-view-estimate-rules.js";
import { newManualTicketViewEstimate } from "./manual-ticket-view-estimate.js";

test("ManualTicketViewEstimateValidator reports every problem", () => {
  const validator = defaultManualTicketViewEstimateValidator();
  const item = newManualTicketViewEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualTicketViewEstimateCodeLengthRule flags a long code", () => {
  const rule = new ManualTicketViewEstimateCodeLengthRule(86400);
  const item = newManualTicketViewEstimate("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualTicketViewEstimateRequiredTitleRule flags a blank title", () => {
  const rule = new ManualTicketViewEstimateRequiredTitleRule("manual ticket view estimate needs this field");
  const item = newManualTicketViewEstimate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualTicketViewEstimateRatioRangeRule flags values above ratio", () => {
  const rule = new ManualTicketViewEstimateRatioRangeRule(7.4, 3124.9);
  const item = newManualTicketViewEstimate("x", "y");
  item.ratio = 3126.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
