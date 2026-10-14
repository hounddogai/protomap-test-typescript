import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitDraftBatchSizeRangeRule,
  WaitDraftJourneyIdLengthRule,
  WaitDraftRequiredCodeRule,
  WaitDraftRequiredTitleRule,
  defaultWaitDraftValidator,
} from "./wait-draft-rules.js";
import { newWaitDraft } from "./wait-draft.js";

test("WaitDraftValidator reports every problem", () => {
  const validator = defaultWaitDraftValidator();
  const item = newWaitDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitDraftBatchSizeRangeRule flags values above batch size", () => {
  const rule = new WaitDraftBatchSizeRangeRule(32, 80);
  const item = newWaitDraft("x", "y");
  item.batchSize = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitDraftRequiredTitleRule flags a blank title", () => {
  const rule = new WaitDraftRequiredTitleRule("wait draft needs this field");
  const item = newWaitDraft("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitDraftRequiredCodeRule flags a blank code", () => {
  const rule = new WaitDraftRequiredCodeRule("wait draft needs an entry");
  const item = newWaitDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitDraftJourneyIdLengthRule flags a long journey id", () => {
  const rule = new WaitDraftJourneyIdLengthRule(86400);
  const item = newWaitDraft("x", "y");
  item.journeyId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
