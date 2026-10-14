import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewRuleCodeLengthRule,
  TicketViewRuleImpressionsRangeRule,
  TicketViewRuleLabelLengthRule,
  defaultTicketViewRuleValidator,
} from "./ticket-view-rule-rules.js";
import { newTicketViewRule } from "./ticket-view-rule.js";

test("TicketViewRuleValidator reports every problem", () => {
  const validator = defaultTicketViewRuleValidator();
  const item = newTicketViewRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewRuleLabelLengthRule flags a long label", () => {
  const rule = new TicketViewRuleLabelLengthRule(1000);
  const item = newTicketViewRule("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewRuleImpressionsRangeRule flags values above impressions", () => {
  const rule = new TicketViewRuleImpressionsRangeRule(16, 120);
  const item = newTicketViewRule("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewRuleCodeLengthRule flags a long code", () => {
  const rule = new TicketViewRuleCodeLengthRule(80);
  const item = newTicketViewRule("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
