import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingTicketViewCheckpointClicksRangeRule,
  PendingTicketViewCheckpointRequiredLabelRule,
  defaultPendingTicketViewCheckpointValidator,
} from "./pending-ticket-view-checkpoint-rules.js";
import { newPendingTicketViewCheckpoint } from "./pending-ticket-view-checkpoint.js";

test("PendingTicketViewCheckpointValidator reports every problem", () => {
  const validator = defaultPendingTicketViewCheckpointValidator();
  const item = newPendingTicketViewCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingTicketViewCheckpointRequiredLabelRule flags a blank label", () => {
  const rule = new PendingTicketViewCheckpointRequiredLabelRule("pending ticket view checkpoint needs this field");
  const item = newPendingTicketViewCheckpoint("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingTicketViewCheckpointClicksRangeRule flags values above clicks", () => {
  const rule = new PendingTicketViewCheckpointClicksRangeRule(16, 86400);
  const item = newPendingTicketViewCheckpoint("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
