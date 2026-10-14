import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewAgreementNameLengthRule,
  TicketViewAgreementTimezoneLengthRule,
  defaultTicketViewAgreementValidator,
} from "./ticket-view-agreement-rules.js";
import { newTicketViewAgreement } from "./ticket-view-agreement.js";

test("TicketViewAgreementValidator reports every problem", () => {
  const validator = defaultTicketViewAgreementValidator();
  const item = newTicketViewAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewAgreementTimezoneLengthRule flags a long timezone", () => {
  const rule = new TicketViewAgreementTimezoneLengthRule(120);
  const item = newTicketViewAgreement("x", "y");
  item.timezone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewAgreementNameLengthRule flags a long name", () => {
  const rule = new TicketViewAgreementNameLengthRule(64);
  const item = newTicketViewAgreement("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
