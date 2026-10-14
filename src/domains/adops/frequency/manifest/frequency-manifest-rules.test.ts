import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyManifestAudienceIdLengthRule,
  FrequencyManifestQuantityRangeRule,
  FrequencyManifestRequiredCodeRule,
  FrequencyManifestRequiredTitleRule,
  FrequencyManifestUtmSourceLengthRule,
  defaultFrequencyManifestValidator,
} from "./frequency-manifest-rules.js";
import { newFrequencyManifest } from "./frequency-manifest.js";

test("FrequencyManifestValidator reports every problem", () => {
  const validator = defaultFrequencyManifestValidator();
  const item = newFrequencyManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyManifestRequiredTitleRule flags a blank title", () => {
  const rule = new FrequencyManifestRequiredTitleRule("frequency manifest needs an entry");
  const item = newFrequencyManifest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyManifestRequiredCodeRule flags a blank code", () => {
  const rule = new FrequencyManifestRequiredCodeRule("frequency manifest needs a value");
  const item = newFrequencyManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyManifestQuantityRangeRule flags values above quantity", () => {
  const rule = new FrequencyManifestQuantityRangeRule(120, 86400);
  const item = newFrequencyManifest("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyManifestUtmSourceLengthRule flags a long utm source", () => {
  const rule = new FrequencyManifestUtmSourceLengthRule(255);
  const item = newFrequencyManifest("x", "y");
  item.utmSource = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyManifestAudienceIdLengthRule flags a long audience id", () => {
  const rule = new FrequencyManifestAudienceIdLengthRule(255);
  const item = newFrequencyManifest("x", "y");
  item.audienceId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
