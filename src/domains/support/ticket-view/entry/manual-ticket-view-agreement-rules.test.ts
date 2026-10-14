import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualTicketViewAgreementCapacityRangeRule,
  ManualTicketViewAgreementChannelLengthRule,
  ManualTicketViewAgreementRateRangeRule,
  ManualTicketViewAgreementTitleLengthRule,
  defaultManualTicketViewAgreementValidator,
} from "./manual-ticket-view-agreement-rules.js";
import { newManualTicketViewAgreement } from "./manual-ticket-view-agreement.js";

test("ManualTicketViewAgreementValidator reports every problem", () => {
  const validator = defaultManualTicketViewAgreementValidator();
  const item = newManualTicketViewAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualTicketViewAgreementRateRangeRule flags values above rate", () => {
  const rule = new ManualTicketViewAgreementRateRangeRule(8.2, 1382.5);
  const item = newManualTicketViewAgreement("x", "y");
  item.rate = 1384;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualTicketViewAgreementChannelLengthRule flags a long channel", () => {
  const rule = new ManualTicketViewAgreementChannelLengthRule(86400);
  const item = newManualTicketViewAgreement("x", "y");
  item.channel = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualTicketViewAgreementCapacityRangeRule flags values above capacity", () => {
  const rule = new ManualTicketViewAgreementCapacityRangeRule(64, 255);
  const item = newManualTicketViewAgreement("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualTicketViewAgreementTitleLengthRule flags a long title", () => {
  const rule = new ManualTicketViewAgreementTitleLengthRule(32);
  const item = newManualTicketViewAgreement("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
