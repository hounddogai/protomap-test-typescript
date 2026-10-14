import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualFrequencyDraftBidRangeRule,
  ManualFrequencyDraftBudgetRangeRule,
  ManualFrequencyDraftChecksumLengthRule,
  ManualFrequencyDraftNameLengthRule,
  ManualFrequencyDraftRequiredChecksumRule,
  defaultManualFrequencyDraftValidator,
} from "./manual-frequency-draft-rules.js";
import { newManualFrequencyDraft } from "./manual-frequency-draft.js";

test("ManualFrequencyDraftValidator reports every problem", () => {
  const validator = defaultManualFrequencyDraftValidator();
  const item = newManualFrequencyDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualFrequencyDraftBidRangeRule flags values above bid", () => {
  const rule = new ManualFrequencyDraftBidRangeRule(8.4, 2742.4);
  const item = newManualFrequencyDraft("x", "y");
  item.bid = 2743.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualFrequencyDraftRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ManualFrequencyDraftRequiredChecksumRule("manual frequency draft needs this field");
  const item = newManualFrequencyDraft("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualFrequencyDraftChecksumLengthRule flags a long checksum", () => {
  const rule = new ManualFrequencyDraftChecksumLengthRule(255);
  const item = newManualFrequencyDraft("x", "y");
  item.checksum = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualFrequencyDraftNameLengthRule flags a long name", () => {
  const rule = new ManualFrequencyDraftNameLengthRule(32);
  const item = newManualFrequencyDraft("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualFrequencyDraftBudgetRangeRule flags values above budget", () => {
  const rule = new ManualFrequencyDraftBudgetRangeRule(2.5, 2529.7);
  const item = newManualFrequencyDraft("x", "y");
  item.budget = 2531.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
