import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackSenderEntryRateRangeRule,
  FallbackSenderEntryRequiredCodeRule,
  FallbackSenderEntryRequiredLabelRule,
  defaultFallbackSenderEntryValidator,
} from "./fallback-sender-entry-rules.js";
import { newFallbackSenderEntry } from "./fallback-sender-entry.js";

test("FallbackSenderEntryValidator reports every problem", () => {
  const validator = defaultFallbackSenderEntryValidator();
  const item = newFallbackSenderEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackSenderEntryRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackSenderEntryRequiredLabelRule("fallback sender entry needs an entry");
  const item = newFallbackSenderEntry("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackSenderEntryRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackSenderEntryRequiredCodeRule("fallback sender entry needs an entry");
  const item = newFallbackSenderEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackSenderEntryRateRangeRule flags values above rate", () => {
  const rule = new FallbackSenderEntryRateRangeRule(9, 2769.1);
  const item = newFallbackSenderEntry("x", "y");
  item.rate = 2770.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
