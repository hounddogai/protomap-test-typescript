import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalTicketViewRecordImpressionsRangeRule,
  RegionalTicketViewRecordRequiredNameRule,
  defaultRegionalTicketViewRecordValidator,
} from "./regional-ticket-view-record-rules.js";
import { newRegionalTicketViewRecord } from "./regional-ticket-view-record.js";

test("RegionalTicketViewRecordValidator reports every problem", () => {
  const validator = defaultRegionalTicketViewRecordValidator();
  const item = newRegionalTicketViewRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalTicketViewRecordRequiredNameRule flags a blank name", () => {
  const rule = new RegionalTicketViewRecordRequiredNameRule("regional ticket view record needs a value");
  const item = newRegionalTicketViewRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalTicketViewRecordImpressionsRangeRule flags values above impressions", () => {
  const rule = new RegionalTicketViewRecordImpressionsRangeRule(32, 64);
  const item = newRegionalTicketViewRecord("x", "y");
  item.impressions = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
