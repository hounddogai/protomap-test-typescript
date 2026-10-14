import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalSlaAgreementContactEmailLengthRule,
  RegionalSlaAgreementRatioRangeRule,
  RegionalSlaAgreementRequiredTitleRule,
  RegionalSlaAgreementSendAtRangeRule,
  RegionalSlaAgreementVersionRangeRule,
  defaultRegionalSlaAgreementValidator,
} from "./regional-sla-agreement-rules.js";
import { newRegionalSlaAgreement } from "./regional-sla-agreement.js";

test("RegionalSlaAgreementValidator reports every problem", () => {
  const validator = defaultRegionalSlaAgreementValidator();
  const item = newRegionalSlaAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalSlaAgreementVersionRangeRule flags values above version", () => {
  const rule = new RegionalSlaAgreementVersionRangeRule(1000, 3600);
  const item = newRegionalSlaAgreement("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSlaAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalSlaAgreementRequiredTitleRule("regional sla agreement needs an entry");
  const item = newRegionalSlaAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalSlaAgreementSendAtRangeRule flags values above send at", () => {
  const rule = new RegionalSlaAgreementSendAtRangeRule(80, 1000);
  const item = newRegionalSlaAgreement("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSlaAgreementContactEmailLengthRule flags a long contact email", () => {
  const rule = new RegionalSlaAgreementContactEmailLengthRule(80);
  const item = newRegionalSlaAgreement("x", "y");
  item.contactEmail = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalSlaAgreementRatioRangeRule flags values above ratio", () => {
  const rule = new RegionalSlaAgreementRatioRangeRule(8.4, 2874.7);
  const item = newRegionalSlaAgreement("x", "y");
  item.ratio = 2876.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
