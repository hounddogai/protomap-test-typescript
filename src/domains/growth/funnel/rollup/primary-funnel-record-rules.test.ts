import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryFunnelRecordChannelLengthRule,
  PrimaryFunnelRecordLabelLengthRule,
  PrimaryFunnelRecordOwnerIdLengthRule,
  PrimaryFunnelRecordRequiredCodeRule,
  defaultPrimaryFunnelRecordValidator,
} from "./primary-funnel-record-rules.js";
import { newPrimaryFunnelRecord } from "./primary-funnel-record.js";

test("PrimaryFunnelRecordValidator reports every problem", () => {
  const validator = defaultPrimaryFunnelRecordValidator();
  const item = newPrimaryFunnelRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryFunnelRecordChannelLengthRule flags a long channel", () => {
  const rule = new PrimaryFunnelRecordChannelLengthRule(3600);
  const item = newPrimaryFunnelRecord("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryFunnelRecordLabelLengthRule flags a long label", () => {
  const rule = new PrimaryFunnelRecordLabelLengthRule(32);
  const item = newPrimaryFunnelRecord("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryFunnelRecordOwnerIdLengthRule flags a long owner id", () => {
  const rule = new PrimaryFunnelRecordOwnerIdLengthRule(16);
  const item = newPrimaryFunnelRecord("x", "y");
  item.ownerId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryFunnelRecordRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryFunnelRecordRequiredCodeRule("primary funnel record needs a value");
  const item = newPrimaryFunnelRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
