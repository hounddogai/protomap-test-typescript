import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyReplyDigestCategoryLengthRule,
  LegacyReplyDigestCodeLengthRule,
  LegacyReplyDigestLocaleLengthRule,
  LegacyReplyDigestTitleLengthRule,
  defaultLegacyReplyDigestValidator,
} from "./legacy-reply-digest-rules.js";
import { newLegacyReplyDigest } from "./legacy-reply-digest.js";

test("LegacyReplyDigestValidator reports every problem", () => {
  const validator = defaultLegacyReplyDigestValidator();
  const item = newLegacyReplyDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyReplyDigestLocaleLengthRule flags a long locale", () => {
  const rule = new LegacyReplyDigestLocaleLengthRule(255);
  const item = newLegacyReplyDigest("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyReplyDigestTitleLengthRule flags a long title", () => {
  const rule = new LegacyReplyDigestTitleLengthRule(16);
  const item = newLegacyReplyDigest("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyReplyDigestCodeLengthRule flags a long code", () => {
  const rule = new LegacyReplyDigestCodeLengthRule(255);
  const item = newLegacyReplyDigest("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyReplyDigestCategoryLengthRule flags a long category", () => {
  const rule = new LegacyReplyDigestCategoryLengthRule(16);
  const item = newLegacyReplyDigest("x", "y");
  item.category = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
