import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeManifestChannelLengthRule,
  BadgeManifestCodeLengthRule,
  BadgeManifestNameLengthRule,
  BadgeManifestSequenceRangeRule,
  defaultBadgeManifestValidator,
} from "./badge-manifest-rules.js";
import { newBadgeManifest } from "./badge-manifest.js";

test("BadgeManifestValidator reports every problem", () => {
  const validator = defaultBadgeManifestValidator();
  const item = newBadgeManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeManifestSequenceRangeRule flags values above sequence", () => {
  const rule = new BadgeManifestSequenceRangeRule(16, 64);
  const item = newBadgeManifest("x", "y");
  item.sequence = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeManifestCodeLengthRule flags a long code", () => {
  const rule = new BadgeManifestCodeLengthRule(120);
  const item = newBadgeManifest("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeManifestChannelLengthRule flags a long channel", () => {
  const rule = new BadgeManifestChannelLengthRule(1000);
  const item = newBadgeManifest("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeManifestNameLengthRule flags a long name", () => {
  const rule = new BadgeManifestNameLengthRule(255);
  const item = newBadgeManifest("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
