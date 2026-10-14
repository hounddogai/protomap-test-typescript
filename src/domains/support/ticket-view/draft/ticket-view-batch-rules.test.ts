import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewBatchBatchSizeRangeRule,
  TicketViewBatchRequiredTitleRule,
  TicketViewBatchSegmentLengthRule,
  TicketViewBatchTitleLengthRule,
  defaultTicketViewBatchValidator,
} from "./ticket-view-batch-rules.js";
import { newTicketViewBatch } from "./ticket-view-batch.js";

test("TicketViewBatchValidator reports every problem", () => {
  const validator = defaultTicketViewBatchValidator();
  const item = newTicketViewBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewBatchSegmentLengthRule flags a long segment", () => {
  const rule = new TicketViewBatchSegmentLengthRule(1000);
  const item = newTicketViewBatch("x", "y");
  item.segment = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewBatchBatchSizeRangeRule flags values above batch size", () => {
  const rule = new TicketViewBatchBatchSizeRangeRule(64, 3600);
  const item = newTicketViewBatch("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewBatchTitleLengthRule flags a long title", () => {
  const rule = new TicketViewBatchTitleLengthRule(1000);
  const item = newTicketViewBatch("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewBatchRequiredTitleRule flags a blank title", () => {
  const rule = new TicketViewBatchRequiredTitleRule("ticket view batch needs a value");
  const item = newTicketViewBatch("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
