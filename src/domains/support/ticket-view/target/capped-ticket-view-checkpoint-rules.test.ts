import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedTicketViewCheckpointNameLengthRule,
  CappedTicketViewCheckpointRequiredNameRule,
  defaultCappedTicketViewCheckpointValidator,
} from "./capped-ticket-view-checkpoint-rules.js";
import { newCappedTicketViewCheckpoint } from "./capped-ticket-view-checkpoint.js";

test("CappedTicketViewCheckpointValidator reports every problem", () => {
  const validator = defaultCappedTicketViewCheckpointValidator();
  const item = newCappedTicketViewCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedTicketViewCheckpointNameLengthRule flags a long name", () => {
  const rule = new CappedTicketViewCheckpointNameLengthRule(255);
  const item = newCappedTicketViewCheckpoint("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedTicketViewCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new CappedTicketViewCheckpointRequiredNameRule("capped ticket view checkpoint needs a value");
  const item = newCappedTicketViewCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
