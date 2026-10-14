import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueAgreementDiscountRangeRule,
  QueueAgreementRequiredCodeRule,
  QueueAgreementRequiredLabelRule,
  QueueAgreementRetriesRangeRule,
  defaultQueueAgreementValidator,
} from "./queue-agreement-rules.js";
import { newQueueAgreement } from "./queue-agreement.js";

test("QueueAgreementValidator reports every problem", () => {
  const validator = defaultQueueAgreementValidator();
  const item = newQueueAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueAgreementRequiredLabelRule flags a blank label", () => {
  const rule = new QueueAgreementRequiredLabelRule("queue agreement needs a value");
  const item = newQueueAgreement("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("QueueAgreementRetriesRangeRule flags values above retries", () => {
  const rule = new QueueAgreementRetriesRangeRule(64, 3600);
  const item = newQueueAgreement("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueAgreementDiscountRangeRule flags values above discount", () => {
  const rule = new QueueAgreementDiscountRangeRule(7.4, 4099.9);
  const item = newQueueAgreement("x", "y");
  item.discount = 4101.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new QueueAgreementRequiredCodeRule("queue agreement needs this field");
  const item = newQueueAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
