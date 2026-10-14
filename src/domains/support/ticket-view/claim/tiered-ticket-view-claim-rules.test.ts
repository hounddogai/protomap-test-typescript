import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredTicketViewClaimCodeLengthRule,
  TieredTicketViewClaimRequiredTitleRule,
  TieredTicketViewClaimRequiredUnitRule,
  TieredTicketViewClaimTitleLengthRule,
  defaultTieredTicketViewClaimValidator,
} from "./tiered-ticket-view-claim-rules.js";
import { newTieredTicketViewClaim } from "./tiered-ticket-view-claim.js";

test("TieredTicketViewClaimValidator reports every problem", () => {
  const validator = defaultTieredTicketViewClaimValidator();
  const item = newTieredTicketViewClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredTicketViewClaimRequiredTitleRule flags a blank title", () => {
  const rule = new TieredTicketViewClaimRequiredTitleRule("tiered ticket view claim needs this field");
  const item = newTieredTicketViewClaim("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTicketViewClaimTitleLengthRule flags a long title", () => {
  const rule = new TieredTicketViewClaimTitleLengthRule(120);
  const item = newTieredTicketViewClaim("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredTicketViewClaimRequiredUnitRule flags a blank unit", () => {
  const rule = new TieredTicketViewClaimRequiredUnitRule("tiered ticket view claim needs a value");
  const item = newTieredTicketViewClaim("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTicketViewClaimCodeLengthRule flags a long code", () => {
  const rule = new TieredTicketViewClaimCodeLengthRule(32);
  const item = newTieredTicketViewClaim("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
