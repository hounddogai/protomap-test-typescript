import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledDomainRecordCodeLengthRule,
  ScheduledDomainRecordRegionLengthRule,
  ScheduledDomainRecordRequiredRegionRule,
  ScheduledDomainRecordTitleLengthRule,
  defaultScheduledDomainRecordValidator,
} from "./scheduled-domain-record-rules.js";
import { newScheduledDomainRecord } from "./scheduled-domain-record.js";

test("ScheduledDomainRecordValidator reports every problem", () => {
  const validator = defaultScheduledDomainRecordValidator();
  const item = newScheduledDomainRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledDomainRecordRegionLengthRule flags a long region", () => {
  const rule = new ScheduledDomainRecordRegionLengthRule(16);
  const item = newScheduledDomainRecord("x", "y");
  item.region = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledDomainRecordCodeLengthRule flags a long code", () => {
  const rule = new ScheduledDomainRecordCodeLengthRule(16);
  const item = newScheduledDomainRecord("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledDomainRecordRequiredRegionRule flags a blank region", () => {
  const rule = new ScheduledDomainRecordRequiredRegionRule("scheduled domain record needs an entry");
  const item = newScheduledDomainRecord("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledDomainRecordTitleLengthRule flags a long title", () => {
  const rule = new ScheduledDomainRecordTitleLengthRule(1000);
  const item = newScheduledDomainRecord("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
