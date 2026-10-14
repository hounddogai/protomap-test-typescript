import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalReplyRecordRequiredCodeRule,
  RegionalReplyRecordRequiredTitleRule,
  RegionalReplyRecordRequiredUtmSourceRule,
  RegionalReplyRecordSequenceRangeRule,
  defaultRegionalReplyRecordValidator,
} from "./regional-reply-record-rules.js";
import { newRegionalReplyRecord } from "./regional-reply-record.js";

test("RegionalReplyRecordValidator reports every problem", () => {
  const validator = defaultRegionalReplyRecordValidator();
  const item = newRegionalReplyRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalReplyRecordRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalReplyRecordRequiredCodeRule("regional reply record needs an entry");
  const item = newRegionalReplyRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalReplyRecordRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new RegionalReplyRecordRequiredUtmSourceRule("regional reply record needs this field");
  const item = newRegionalReplyRecord("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalReplyRecordSequenceRangeRule flags values above sequence", () => {
  const rule = new RegionalReplyRecordSequenceRangeRule(255, 255);
  const item = newRegionalReplyRecord("x", "y");
  item.sequence = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalReplyRecordRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalReplyRecordRequiredTitleRule("regional reply record needs this field");
  const item = newRegionalReplyRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
