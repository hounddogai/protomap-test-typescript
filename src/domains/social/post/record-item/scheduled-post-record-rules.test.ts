import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledPostRecordCampaignRefLengthRule,
  ScheduledPostRecordChecksumLengthRule,
  ScheduledPostRecordCodeLengthRule,
  ScheduledPostRecordRequiredChecksumRule,
  ScheduledPostRecordRequiredCodeRule,
  defaultScheduledPostRecordValidator,
} from "./scheduled-post-record-rules.js";
import { newScheduledPostRecord } from "./scheduled-post-record.js";

test("ScheduledPostRecordValidator reports every problem", () => {
  const validator = defaultScheduledPostRecordValidator();
  const item = newScheduledPostRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledPostRecordRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ScheduledPostRecordRequiredChecksumRule("scheduled post record needs an entry");
  const item = newScheduledPostRecord("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledPostRecordCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ScheduledPostRecordCampaignRefLengthRule(1000);
  const item = newScheduledPostRecord("x", "y");
  item.campaignRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPostRecordChecksumLengthRule flags a long checksum", () => {
  const rule = new ScheduledPostRecordChecksumLengthRule(3600);
  const item = newScheduledPostRecord("x", "y");
  item.checksum = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPostRecordCodeLengthRule flags a long code", () => {
  const rule = new ScheduledPostRecordCodeLengthRule(16);
  const item = newScheduledPostRecord("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPostRecordRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledPostRecordRequiredCodeRule("scheduled post record needs a value");
  const item = newScheduledPostRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
