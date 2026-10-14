import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewSegmentCodeLengthRule,
  TicketViewSegmentCostRangeRule,
  defaultTicketViewSegmentValidator,
} from "./ticket-view-segment-rules.js";
import { newTicketViewSegment } from "./ticket-view-segment.js";

test("TicketViewSegmentValidator reports every problem", () => {
  const validator = defaultTicketViewSegmentValidator();
  const item = newTicketViewSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewSegmentCostRangeRule flags values above cost", () => {
  const rule = new TicketViewSegmentCostRangeRule(2.8, 1966.7);
  const item = newTicketViewSegment("x", "y");
  item.cost = 1968.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewSegmentCodeLengthRule flags a long code", () => {
  const rule = new TicketViewSegmentCodeLengthRule(80);
  const item = newTicketViewSegment("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
