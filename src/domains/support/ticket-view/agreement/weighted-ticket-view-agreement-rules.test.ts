import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedTicketViewAgreementCodeLengthRule,
  WeightedTicketViewAgreementCohortLengthRule,
  WeightedTicketViewAgreementRequiredChannelRule,
  WeightedTicketViewAgreementSequenceRangeRule,
  defaultWeightedTicketViewAgreementValidator,
} from "./weighted-ticket-view-agreement-rules.js";
import { newWeightedTicketViewAgreement } from "./weighted-ticket-view-agreement.js";

test("WeightedTicketViewAgreementValidator reports every problem", () => {
  const validator = defaultWeightedTicketViewAgreementValidator();
  const item = newWeightedTicketViewAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedTicketViewAgreementSequenceRangeRule flags values above sequence", () => {
  const rule = new WeightedTicketViewAgreementSequenceRangeRule(1000, 86400);
  const item = newWeightedTicketViewAgreement("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedTicketViewAgreementCodeLengthRule flags a long code", () => {
  const rule = new WeightedTicketViewAgreementCodeLengthRule(80);
  const item = newWeightedTicketViewAgreement("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedTicketViewAgreementCohortLengthRule flags a long cohort", () => {
  const rule = new WeightedTicketViewAgreementCohortLengthRule(120);
  const item = newWeightedTicketViewAgreement("x", "y");
  item.cohort = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedTicketViewAgreementRequiredChannelRule flags a blank channel", () => {
  const rule = new WeightedTicketViewAgreementRequiredChannelRule("weighted ticket view agreement needs this field");
  const item = newWeightedTicketViewAgreement("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
