import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationNoticeCodeLengthRule,
  ReputationNoticeCostRangeRule,
  ReputationNoticeRequiredCodeRule,
  ReputationNoticeRequiredJourneyIdRule,
  defaultReputationNoticeValidator,
} from "./reputation-notice-rules.js";
import { newReputationNotice } from "./reputation-notice.js";

test("ReputationNoticeValidator reports every problem", () => {
  const validator = defaultReputationNoticeValidator();
  const item = newReputationNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationNoticeCostRangeRule flags values above cost", () => {
  const rule = new ReputationNoticeCostRangeRule(8.3, 3954.5);
  const item = newReputationNotice("x", "y");
  item.cost = 3956;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new ReputationNoticeRequiredCodeRule("reputation notice needs this field");
  const item = newReputationNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationNoticeCodeLengthRule flags a long code", () => {
  const rule = new ReputationNoticeCodeLengthRule(120);
  const item = newReputationNotice("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationNoticeRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new ReputationNoticeRequiredJourneyIdRule("reputation notice needs a value");
  const item = newReputationNotice("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
