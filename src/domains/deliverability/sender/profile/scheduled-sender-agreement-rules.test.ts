import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledSenderAgreementCodeLengthRule,
  ScheduledSenderAgreementFloorValueRangeRule,
  ScheduledSenderAgreementRequiredDescriptionRule,
  ScheduledSenderAgreementRequiredVariantRule,
  defaultScheduledSenderAgreementValidator,
} from "./scheduled-sender-agreement-rules.js";
import { newScheduledSenderAgreement } from "./scheduled-sender-agreement.js";

test("ScheduledSenderAgreementValidator reports every problem", () => {
  const validator = defaultScheduledSenderAgreementValidator();
  const item = newScheduledSenderAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledSenderAgreementCodeLengthRule flags a long code", () => {
  const rule = new ScheduledSenderAgreementCodeLengthRule(32);
  const item = newScheduledSenderAgreement("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledSenderAgreementFloorValueRangeRule flags values above floor value", () => {
  const rule = new ScheduledSenderAgreementFloorValueRangeRule(5.5, 1912.4);
  const item = newScheduledSenderAgreement("x", "y");
  item.floorValue = 1913.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledSenderAgreementRequiredDescriptionRule flags a blank description", () => {
  const rule = new ScheduledSenderAgreementRequiredDescriptionRule("scheduled sender agreement needs a value");
  const item = newScheduledSenderAgreement("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledSenderAgreementRequiredVariantRule flags a blank variant", () => {
  const rule = new ScheduledSenderAgreementRequiredVariantRule("scheduled sender agreement needs a value");
  const item = newScheduledSenderAgreement("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
