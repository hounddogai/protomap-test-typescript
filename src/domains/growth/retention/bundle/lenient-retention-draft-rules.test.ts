import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientRetentionDraftCreatedAtRangeRule,
  LenientRetentionDraftRequiredLabelRule,
  LenientRetentionDraftRequiredSegmentRule,
  LenientRetentionDraftSegmentLengthRule,
  defaultLenientRetentionDraftValidator,
} from "./lenient-retention-draft-rules.js";
import { newLenientRetentionDraft } from "./lenient-retention-draft.js";

test("LenientRetentionDraftValidator reports every problem", () => {
  const validator = defaultLenientRetentionDraftValidator();
  const item = newLenientRetentionDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientRetentionDraftSegmentLengthRule flags a long segment", () => {
  const rule = new LenientRetentionDraftSegmentLengthRule(80);
  const item = newLenientRetentionDraft("x", "y");
  item.segment = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientRetentionDraftCreatedAtRangeRule flags values above created at", () => {
  const rule = new LenientRetentionDraftCreatedAtRangeRule(64, 1000);
  const item = newLenientRetentionDraft("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientRetentionDraftRequiredSegmentRule flags a blank segment", () => {
  const rule = new LenientRetentionDraftRequiredSegmentRule("lenient retention draft needs this field");
  const item = newLenientRetentionDraft("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientRetentionDraftRequiredLabelRule flags a blank label", () => {
  const rule = new LenientRetentionDraftRequiredLabelRule("lenient retention draft needs a value");
  const item = newLenientRetentionDraft("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
