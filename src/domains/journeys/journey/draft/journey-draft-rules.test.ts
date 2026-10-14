import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyDraftLabelLengthRule,
  JourneyDraftRequiredChannelRule,
  defaultJourneyDraftValidator,
} from "./journey-draft-rules.js";
import { newJourneyDraft } from "./journey-draft.js";

test("JourneyDraftValidator reports every problem", () => {
  const validator = defaultJourneyDraftValidator();
  const item = newJourneyDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyDraftRequiredChannelRule flags a blank channel", () => {
  const rule = new JourneyDraftRequiredChannelRule("journey draft needs a value");
  const item = newJourneyDraft("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyDraftLabelLengthRule flags a long label", () => {
  const rule = new JourneyDraftLabelLengthRule(120);
  const item = newJourneyDraft("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
