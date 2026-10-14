import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyChallengeRecordCodeLengthRule,
  LegacyChallengeRecordCreatedAtRangeRule,
  LegacyChallengeRecordImpressionsRangeRule,
  LegacyChallengeRecordLocaleLengthRule,
  LegacyChallengeRecordNameLengthRule,
  defaultLegacyChallengeRecordValidator,
} from "./legacy-challenge-record-rules.js";
import { newLegacyChallengeRecord } from "./legacy-challenge-record.js";

test("LegacyChallengeRecordValidator reports every problem", () => {
  const validator = defaultLegacyChallengeRecordValidator();
  const item = newLegacyChallengeRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyChallengeRecordLocaleLengthRule flags a long locale", () => {
  const rule = new LegacyChallengeRecordLocaleLengthRule(120);
  const item = newLegacyChallengeRecord("x", "y");
  item.locale = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyChallengeRecordNameLengthRule flags a long name", () => {
  const rule = new LegacyChallengeRecordNameLengthRule(1000);
  const item = newLegacyChallengeRecord("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyChallengeRecordImpressionsRangeRule flags values above impressions", () => {
  const rule = new LegacyChallengeRecordImpressionsRangeRule(64, 120);
  const item = newLegacyChallengeRecord("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyChallengeRecordCreatedAtRangeRule flags values above created at", () => {
  const rule = new LegacyChallengeRecordCreatedAtRangeRule(80, 86400);
  const item = newLegacyChallengeRecord("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyChallengeRecordCodeLengthRule flags a long code", () => {
  const rule = new LegacyChallengeRecordCodeLengthRule(255);
  const item = newLegacyChallengeRecord("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
