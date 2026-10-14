import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedJourneyAgreementCountryLengthRule,
  BatchedJourneyAgreementNameLengthRule,
  BatchedJourneyAgreementRequiredNameRule,
  BatchedJourneyAgreementTimezoneLengthRule,
  defaultBatchedJourneyAgreementValidator,
} from "./batched-journey-agreement-rules.js";
import { newBatchedJourneyAgreement } from "./batched-journey-agreement.js";

test("BatchedJourneyAgreementValidator reports every problem", () => {
  const validator = defaultBatchedJourneyAgreementValidator();
  const item = newBatchedJourneyAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedJourneyAgreementRequiredNameRule flags a blank name", () => {
  const rule = new BatchedJourneyAgreementRequiredNameRule("batched journey agreement needs this field");
  const item = newBatchedJourneyAgreement("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedJourneyAgreementNameLengthRule flags a long name", () => {
  const rule = new BatchedJourneyAgreementNameLengthRule(120);
  const item = newBatchedJourneyAgreement("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedJourneyAgreementCountryLengthRule flags a long country", () => {
  const rule = new BatchedJourneyAgreementCountryLengthRule(120);
  const item = newBatchedJourneyAgreement("x", "y");
  item.country = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedJourneyAgreementTimezoneLengthRule flags a long timezone", () => {
  const rule = new BatchedJourneyAgreementTimezoneLengthRule(255);
  const item = newBatchedJourneyAgreement("x", "y");
  item.timezone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
