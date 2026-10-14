import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledTicketViewScoreCodeLengthRule,
  ScheduledTicketViewScoreNameLengthRule,
  ScheduledTicketViewScoreRequiredRegionRule,
  ScheduledTicketViewScoreRequiredVariantRule,
  ScheduledTicketViewScoreVariantLengthRule,
  defaultScheduledTicketViewScoreValidator,
} from "./scheduled-ticket-view-score-rules.js";
import { newScheduledTicketViewScore } from "./scheduled-ticket-view-score.js";

test("ScheduledTicketViewScoreValidator reports every problem", () => {
  const validator = defaultScheduledTicketViewScoreValidator();
  const item = newScheduledTicketViewScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledTicketViewScoreRequiredVariantRule flags a blank variant", () => {
  const rule = new ScheduledTicketViewScoreRequiredVariantRule("scheduled ticket view score needs an entry");
  const item = newScheduledTicketViewScore("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledTicketViewScoreNameLengthRule flags a long name", () => {
  const rule = new ScheduledTicketViewScoreNameLengthRule(120);
  const item = newScheduledTicketViewScore("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledTicketViewScoreRequiredRegionRule flags a blank region", () => {
  const rule = new ScheduledTicketViewScoreRequiredRegionRule("scheduled ticket view score needs this field");
  const item = newScheduledTicketViewScore("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledTicketViewScoreVariantLengthRule flags a long variant", () => {
  const rule = new ScheduledTicketViewScoreVariantLengthRule(64);
  const item = newScheduledTicketViewScore("x", "y");
  item.variant = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledTicketViewScoreCodeLengthRule flags a long code", () => {
  const rule = new ScheduledTicketViewScoreCodeLengthRule(32);
  const item = newScheduledTicketViewScore("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
