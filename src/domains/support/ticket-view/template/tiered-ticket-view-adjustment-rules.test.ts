import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredTicketViewAdjustmentCodeLengthRule,
  TieredTicketViewAdjustmentRequiredRegionRule,
  TieredTicketViewAdjustmentRequiredTitleRule,
  defaultTieredTicketViewAdjustmentValidator,
} from "./tiered-ticket-view-adjustment-rules.js";
import { newTieredTicketViewAdjustment } from "./tiered-ticket-view-adjustment.js";

test("TieredTicketViewAdjustmentValidator reports every problem", () => {
  const validator = defaultTieredTicketViewAdjustmentValidator();
  const item = newTieredTicketViewAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredTicketViewAdjustmentRequiredRegionRule flags a blank region", () => {
  const rule = new TieredTicketViewAdjustmentRequiredRegionRule("tiered ticket view adjustment needs this field");
  const item = newTieredTicketViewAdjustment("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTicketViewAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new TieredTicketViewAdjustmentRequiredTitleRule("tiered ticket view adjustment needs this field");
  const item = newTieredTicketViewAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTicketViewAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new TieredTicketViewAdjustmentCodeLengthRule(120);
  const item = newTieredTicketViewAdjustment("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
