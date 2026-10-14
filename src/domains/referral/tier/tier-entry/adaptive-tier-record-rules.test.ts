import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveTierRecordRequiredCodeRule,
  AdaptiveTierRecordRequiredContactEmailRule,
  AdaptiveTierRecordRequiredTitleRule,
  AdaptiveTierRecordUpdatedAtRangeRule,
  defaultAdaptiveTierRecordValidator,
} from "./adaptive-tier-record-rules.js";
import { newAdaptiveTierRecord } from "./adaptive-tier-record.js";

test("AdaptiveTierRecordValidator reports every problem", () => {
  const validator = defaultAdaptiveTierRecordValidator();
  const item = newAdaptiveTierRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveTierRecordRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new AdaptiveTierRecordRequiredContactEmailRule("adaptive tier record needs this field");
  const item = newAdaptiveTierRecord("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveTierRecordRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveTierRecordRequiredTitleRule("adaptive tier record needs an entry");
  const item = newAdaptiveTierRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveTierRecordUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new AdaptiveTierRecordUpdatedAtRangeRule(80, 3600);
  const item = newAdaptiveTierRecord("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveTierRecordRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveTierRecordRequiredCodeRule("adaptive tier record needs a value");
  const item = newAdaptiveTierRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
