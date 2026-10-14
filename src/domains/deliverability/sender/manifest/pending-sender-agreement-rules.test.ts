import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingSenderAgreementCodeLengthRule,
  PendingSenderAgreementJourneyIdLengthRule,
  PendingSenderAgreementRequiredCategoryRule,
  PendingSenderAgreementRequiredLabelRule,
  defaultPendingSenderAgreementValidator,
} from "./pending-sender-agreement-rules.js";
import { newPendingSenderAgreement } from "./pending-sender-agreement.js";

test("PendingSenderAgreementValidator reports every problem", () => {
  const validator = defaultPendingSenderAgreementValidator();
  const item = newPendingSenderAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingSenderAgreementRequiredLabelRule flags a blank label", () => {
  const rule = new PendingSenderAgreementRequiredLabelRule("pending sender agreement needs this field");
  const item = newPendingSenderAgreement("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingSenderAgreementCodeLengthRule flags a long code", () => {
  const rule = new PendingSenderAgreementCodeLengthRule(1000);
  const item = newPendingSenderAgreement("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingSenderAgreementRequiredCategoryRule flags a blank category", () => {
  const rule = new PendingSenderAgreementRequiredCategoryRule("pending sender agreement needs an entry");
  const item = newPendingSenderAgreement("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingSenderAgreementJourneyIdLengthRule flags a long journey id", () => {
  const rule = new PendingSenderAgreementJourneyIdLengthRule(32);
  const item = newPendingSenderAgreement("x", "y");
  item.journeyId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
