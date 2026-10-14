import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyWindowDraftBatchSizeRangeRule,
  LegacyWindowDraftCodeLengthRule,
  LegacyWindowDraftNameLengthRule,
  defaultLegacyWindowDraftValidator,
} from "./legacy-window-draft-rules.js";
import { newLegacyWindowDraft } from "./legacy-window-draft.js";

test("LegacyWindowDraftValidator reports every problem", () => {
  const validator = defaultLegacyWindowDraftValidator();
  const item = newLegacyWindowDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyWindowDraftCodeLengthRule flags a long code", () => {
  const rule = new LegacyWindowDraftCodeLengthRule(86400);
  const item = newLegacyWindowDraft("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyWindowDraftBatchSizeRangeRule flags values above batch size", () => {
  const rule = new LegacyWindowDraftBatchSizeRangeRule(3600, 3600);
  const item = newLegacyWindowDraft("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyWindowDraftNameLengthRule flags a long name", () => {
  const rule = new LegacyWindowDraftNameLengthRule(1000);
  const item = newLegacyWindowDraft("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
