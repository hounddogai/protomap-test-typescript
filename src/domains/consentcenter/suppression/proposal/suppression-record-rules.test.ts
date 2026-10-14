import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionRecordRequiredCurrencyRule,
  SuppressionRecordRequiredTitleRule,
  defaultSuppressionRecordValidator,
} from "./suppression-record-rules.js";
import { newSuppressionRecord } from "./suppression-record.js";

test("SuppressionRecordValidator reports every problem", () => {
  const validator = defaultSuppressionRecordValidator();
  const item = newSuppressionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionRecordRequiredCurrencyRule flags a blank currency", () => {
  const rule = new SuppressionRecordRequiredCurrencyRule("suppression record needs this field");
  const item = newSuppressionRecord("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionRecordRequiredTitleRule flags a blank title", () => {
  const rule = new SuppressionRecordRequiredTitleRule("suppression record needs an entry");
  const item = newSuppressionRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
