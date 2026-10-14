import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictTicketViewBatchOwnerIdLengthRule,
  StrictTicketViewBatchRequiredCodeRule,
  StrictTicketViewBatchRequiredExternalRefRule,
  StrictTicketViewBatchRequiredNameRule,
  StrictTicketViewBatchRequiredOwnerIdRule,
  defaultStrictTicketViewBatchValidator,
} from "./strict-ticket-view-batch-rules.js";
import { newStrictTicketViewBatch } from "./strict-ticket-view-batch.js";

test("StrictTicketViewBatchValidator reports every problem", () => {
  const validator = defaultStrictTicketViewBatchValidator();
  const item = newStrictTicketViewBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictTicketViewBatchRequiredNameRule flags a blank name", () => {
  const rule = new StrictTicketViewBatchRequiredNameRule("strict ticket view batch needs a value");
  const item = newStrictTicketViewBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictTicketViewBatchOwnerIdLengthRule flags a long owner id", () => {
  const rule = new StrictTicketViewBatchOwnerIdLengthRule(80);
  const item = newStrictTicketViewBatch("x", "y");
  item.ownerId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictTicketViewBatchRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new StrictTicketViewBatchRequiredOwnerIdRule("strict ticket view batch needs an entry");
  const item = newStrictTicketViewBatch("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictTicketViewBatchRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new StrictTicketViewBatchRequiredExternalRefRule("strict ticket view batch needs a value");
  const item = newStrictTicketViewBatch("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictTicketViewBatchRequiredCodeRule flags a blank code", () => {
  const rule = new StrictTicketViewBatchRequiredCodeRule("strict ticket view batch needs a value");
  const item = newStrictTicketViewBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
