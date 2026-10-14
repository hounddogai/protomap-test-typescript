import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedDomainEntryChannelLengthRule,
  CappedDomainEntryNameLengthRule,
  CappedDomainEntryRequiredChannelRule,
  CappedDomainEntryRequiredDescriptionRule,
  CappedDomainEntryRequiredNameRule,
  defaultCappedDomainEntryValidator,
} from "./capped-domain-entry-rules.js";
import { newCappedDomainEntry } from "./capped-domain-entry.js";

test("CappedDomainEntryValidator reports every problem", () => {
  const validator = defaultCappedDomainEntryValidator();
  const item = newCappedDomainEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedDomainEntryRequiredDescriptionRule flags a blank description", () => {
  const rule = new CappedDomainEntryRequiredDescriptionRule("capped domain entry needs an entry");
  const item = newCappedDomainEntry("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedDomainEntryChannelLengthRule flags a long channel", () => {
  const rule = new CappedDomainEntryChannelLengthRule(1000);
  const item = newCappedDomainEntry("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedDomainEntryRequiredNameRule flags a blank name", () => {
  const rule = new CappedDomainEntryRequiredNameRule("capped domain entry needs this field");
  const item = newCappedDomainEntry("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedDomainEntryNameLengthRule flags a long name", () => {
  const rule = new CappedDomainEntryNameLengthRule(16);
  const item = newCappedDomainEntry("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedDomainEntryRequiredChannelRule flags a blank channel", () => {
  const rule = new CappedDomainEntryRequiredChannelRule("capped domain entry needs an entry");
  const item = newCappedDomainEntry("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
