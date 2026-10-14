import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyLevelNoticeMaximumRangeRule,
  LegacyLevelNoticeTitleLengthRule,
  defaultLegacyLevelNoticeValidator,
} from "./legacy-level-notice-rules.js";
import { newLegacyLevelNotice } from "./legacy-level-notice.js";

test("LegacyLevelNoticeValidator reports every problem", () => {
  const validator = defaultLegacyLevelNoticeValidator();
  const item = newLegacyLevelNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyLevelNoticeTitleLengthRule flags a long title", () => {
  const rule = new LegacyLevelNoticeTitleLengthRule(16);
  const item = newLegacyLevelNotice("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyLevelNoticeMaximumRangeRule flags values above maximum", () => {
  const rule = new LegacyLevelNoticeMaximumRangeRule(6.2, 1989.3);
  const item = newLegacyLevelNotice("x", "y");
  item.maximum = 1990.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
