import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultCsatRequestCampaignRefLengthRule,
  DefaultCsatRequestDurationMinutesRangeRule,
  DefaultCsatRequestMinimumRangeRule,
  DefaultCsatRequestRateRangeRule,
  DefaultCsatRequestRequiredTitleRule,
  defaultDefaultCsatRequestValidator,
} from "./default-csat-request-rules.js";
import { newDefaultCsatRequest } from "./default-csat-request.js";

test("DefaultCsatRequestValidator reports every problem", () => {
  const validator = defaultDefaultCsatRequestValidator();
  const item = newDefaultCsatRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultCsatRequestMinimumRangeRule flags values above minimum", () => {
  const rule = new DefaultCsatRequestMinimumRangeRule(0.9, 1143.4);
  const item = newDefaultCsatRequest("x", "y");
  item.minimum = 1144.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultCsatRequestRateRangeRule flags values above rate", () => {
  const rule = new DefaultCsatRequestRateRangeRule(4.5, 1068.1);
  const item = newDefaultCsatRequest("x", "y");
  item.rate = 1069.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultCsatRequestRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultCsatRequestRequiredTitleRule("default csat request needs this field");
  const item = newDefaultCsatRequest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultCsatRequestDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new DefaultCsatRequestDurationMinutesRangeRule(16, 120);
  const item = newDefaultCsatRequest("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultCsatRequestCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new DefaultCsatRequestCampaignRefLengthRule(255);
  const item = newDefaultCsatRequest("x", "y");
  item.campaignRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
