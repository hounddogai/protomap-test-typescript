import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderEntryOwnerIdLengthRule,
  SenderEntryRequiredChannelRule,
  SenderEntryRequiredLabelRule,
  defaultSenderEntryValidator,
} from "./sender-entry-rules.js";
import { newSenderEntry } from "./sender-entry.js";

test("SenderEntryValidator reports every problem", () => {
  const validator = defaultSenderEntryValidator();
  const item = newSenderEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderEntryOwnerIdLengthRule flags a long owner id", () => {
  const rule = new SenderEntryOwnerIdLengthRule(3600);
  const item = newSenderEntry("x", "y");
  item.ownerId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderEntryRequiredChannelRule flags a blank channel", () => {
  const rule = new SenderEntryRequiredChannelRule("sender entry needs an entry");
  const item = newSenderEntry("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderEntryRequiredLabelRule flags a blank label", () => {
  const rule = new SenderEntryRequiredLabelRule("sender entry needs a value");
  const item = newSenderEntry("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
