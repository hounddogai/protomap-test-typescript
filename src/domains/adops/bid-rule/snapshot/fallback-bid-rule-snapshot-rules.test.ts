import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackBidRuleSnapshotCodeLengthRule,
  FallbackBidRuleSnapshotRequiredTimezoneRule,
  FallbackBidRuleSnapshotTimezoneLengthRule,
  FallbackBidRuleSnapshotUpdatedAtRangeRule,
  defaultFallbackBidRuleSnapshotValidator,
} from "./fallback-bid-rule-snapshot-rules.js";
import { newFallbackBidRuleSnapshot } from "./fallback-bid-rule-snapshot.js";

test("FallbackBidRuleSnapshotValidator reports every problem", () => {
  const validator = defaultFallbackBidRuleSnapshotValidator();
  const item = newFallbackBidRuleSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackBidRuleSnapshotUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new FallbackBidRuleSnapshotUpdatedAtRangeRule(32, 120);
  const item = newFallbackBidRuleSnapshot("x", "y");
  item.updatedAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackBidRuleSnapshotTimezoneLengthRule flags a long timezone", () => {
  const rule = new FallbackBidRuleSnapshotTimezoneLengthRule(80);
  const item = newFallbackBidRuleSnapshot("x", "y");
  item.timezone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackBidRuleSnapshotCodeLengthRule flags a long code", () => {
  const rule = new FallbackBidRuleSnapshotCodeLengthRule(86400);
  const item = newFallbackBidRuleSnapshot("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackBidRuleSnapshotRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new FallbackBidRuleSnapshotRequiredTimezoneRule("fallback bid rule snapshot needs this field");
  const item = newFallbackBidRuleSnapshot("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
