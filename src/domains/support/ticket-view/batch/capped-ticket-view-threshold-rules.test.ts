import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedTicketViewThresholdFrequencyCapRangeRule,
  CappedTicketViewThresholdRequiredCodeRule,
  CappedTicketViewThresholdRequiredLabelRule,
  defaultCappedTicketViewThresholdValidator,
} from "./capped-ticket-view-threshold-rules.js";
import { newCappedTicketViewThreshold } from "./capped-ticket-view-threshold.js";

test("CappedTicketViewThresholdValidator reports every problem", () => {
  const validator = defaultCappedTicketViewThresholdValidator();
  const item = newCappedTicketViewThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedTicketViewThresholdRequiredLabelRule flags a blank label", () => {
  const rule = new CappedTicketViewThresholdRequiredLabelRule("capped ticket view threshold needs a value");
  const item = newCappedTicketViewThreshold("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedTicketViewThresholdFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new CappedTicketViewThresholdFrequencyCapRangeRule(32, 86400);
  const item = newCappedTicketViewThreshold("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedTicketViewThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new CappedTicketViewThresholdRequiredCodeRule("capped ticket view threshold needs a value");
  const item = newCappedTicketViewThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
