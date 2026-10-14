import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryTicketViewCheckpointCodeLengthRule,
  PrimaryTicketViewCheckpointRequiredCodeRule,
  PrimaryTicketViewCheckpointRequiredExternalRefRule,
  PrimaryTicketViewCheckpointRequiredRegionRule,
  PrimaryTicketViewCheckpointRequiredTitleRule,
  defaultPrimaryTicketViewCheckpointValidator,
} from "./primary-ticket-view-checkpoint-rules.js";
import { newPrimaryTicketViewCheckpoint } from "./primary-ticket-view-checkpoint.js";

test("PrimaryTicketViewCheckpointValidator reports every problem", () => {
  const validator = defaultPrimaryTicketViewCheckpointValidator();
  const item = newPrimaryTicketViewCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryTicketViewCheckpointCodeLengthRule flags a long code", () => {
  const rule = new PrimaryTicketViewCheckpointCodeLengthRule(3600);
  const item = newPrimaryTicketViewCheckpoint("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryTicketViewCheckpointRequiredRegionRule flags a blank region", () => {
  const rule = new PrimaryTicketViewCheckpointRequiredRegionRule("primary ticket view checkpoint needs a value");
  const item = newPrimaryTicketViewCheckpoint("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryTicketViewCheckpointRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryTicketViewCheckpointRequiredTitleRule("primary ticket view checkpoint needs a value");
  const item = newPrimaryTicketViewCheckpoint("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryTicketViewCheckpointRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new PrimaryTicketViewCheckpointRequiredExternalRefRule("primary ticket view checkpoint needs this field");
  const item = newPrimaryTicketViewCheckpoint("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryTicketViewCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryTicketViewCheckpointRequiredCodeRule("primary ticket view checkpoint needs this field");
  const item = newPrimaryTicketViewCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
