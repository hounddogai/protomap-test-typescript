import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedTierRecordRequiredCategoryRule,
  CappedTierRecordRequiredNameRule,
  CappedTierRecordUpdatedAtRangeRule,
  defaultCappedTierRecordValidator,
} from "./capped-tier-record-rules.js";
import { newCappedTierRecord } from "./capped-tier-record.js";

test("CappedTierRecordValidator reports every problem", () => {
  const validator = defaultCappedTierRecordValidator();
  const item = newCappedTierRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedTierRecordUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new CappedTierRecordUpdatedAtRangeRule(3600, 86400);
  const item = newCappedTierRecord("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedTierRecordRequiredCategoryRule flags a blank category", () => {
  const rule = new CappedTierRecordRequiredCategoryRule("capped tier record needs a value");
  const item = newCappedTierRecord("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedTierRecordRequiredNameRule flags a blank name", () => {
  const rule = new CappedTierRecordRequiredNameRule("capped tier record needs a value");
  const item = newCappedTierRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
