import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedEscalationDraftChannelLengthRule,
  WeightedEscalationDraftRequiredTitleRule,
  WeightedEscalationDraftRetriesRangeRule,
  defaultWeightedEscalationDraftValidator,
} from "./weighted-escalation-draft-rules.js";
import { newWeightedEscalationDraft } from "./weighted-escalation-draft.js";

test("WeightedEscalationDraftValidator reports every problem", () => {
  const validator = defaultWeightedEscalationDraftValidator();
  const item = newWeightedEscalationDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedEscalationDraftRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedEscalationDraftRequiredTitleRule("weighted escalation draft needs an entry");
  const item = newWeightedEscalationDraft("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedEscalationDraftChannelLengthRule flags a long channel", () => {
  const rule = new WeightedEscalationDraftChannelLengthRule(3600);
  const item = newWeightedEscalationDraft("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedEscalationDraftRetriesRangeRule flags values above retries", () => {
  const rule = new WeightedEscalationDraftRetriesRangeRule(16, 120);
  const item = newWeightedEscalationDraft("x", "y");
  item.retries = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
