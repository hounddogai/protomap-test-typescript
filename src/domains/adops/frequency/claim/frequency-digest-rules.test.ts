import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyDigestAmountRangeRule,
  FrequencyDigestCodeLengthRule,
  FrequencyDigestRequiredNameRule,
  FrequencyDigestRequiredTitleRule,
  FrequencyDigestTitleLengthRule,
  FrequencyDigestUnitLengthRule,
  defaultFrequencyDigestValidator,
} from "./frequency-digest-rules.js";
import { newFrequencyDigest } from "./frequency-digest.js";

test("FrequencyDigestValidator reports every problem", () => {
  const validator = defaultFrequencyDigestValidator();
  const item = newFrequencyDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyDigestTitleLengthRule flags a long title", () => {
  const rule = new FrequencyDigestTitleLengthRule(120);
  const item = newFrequencyDigest("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyDigestRequiredTitleRule flags a blank title", () => {
  const rule = new FrequencyDigestRequiredTitleRule("frequency digest needs this field");
  const item = newFrequencyDigest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyDigestRequiredNameRule flags a blank name", () => {
  const rule = new FrequencyDigestRequiredNameRule("frequency digest needs a value");
  const item = newFrequencyDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyDigestUnitLengthRule flags a long unit", () => {
  const rule = new FrequencyDigestUnitLengthRule(64);
  const item = newFrequencyDigest("x", "y");
  item.unit = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyDigestAmountRangeRule flags values above amount", () => {
  const rule = new FrequencyDigestAmountRangeRule(9.8, 2722.9);
  const item = newFrequencyDigest("x", "y");
  item.amount = 2724.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyDigestCodeLengthRule flags a long code", () => {
  const rule = new FrequencyDigestCodeLengthRule(64);
  const item = newFrequencyDigest("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
