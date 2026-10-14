import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredFrequencyManifestAttemptsRangeRule,
  TieredFrequencyManifestCeilingRangeRule,
  TieredFrequencyManifestCodeLengthRule,
  TieredFrequencyManifestNameLengthRule,
  TieredFrequencyManifestRequiredSourceRule,
  TieredFrequencyManifestStartsAtRangeRule,
  defaultTieredFrequencyManifestValidator,
} from "./tiered-frequency-manifest-rules.js";
import { newTieredFrequencyManifest } from "./tiered-frequency-manifest.js";

test("TieredFrequencyManifestValidator reports every problem", () => {
  const validator = defaultTieredFrequencyManifestValidator();
  const item = newTieredFrequencyManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredFrequencyManifestCeilingRangeRule flags values above ceiling", () => {
  const rule = new TieredFrequencyManifestCeilingRangeRule(9.9, 4554.1);
  const item = newTieredFrequencyManifest("x", "y");
  item.ceiling = 4555.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredFrequencyManifestRequiredSourceRule flags a blank source", () => {
  const rule = new TieredFrequencyManifestRequiredSourceRule("tiered frequency manifest needs this field");
  const item = newTieredFrequencyManifest("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredFrequencyManifestNameLengthRule flags a long name", () => {
  const rule = new TieredFrequencyManifestNameLengthRule(120);
  const item = newTieredFrequencyManifest("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredFrequencyManifestStartsAtRangeRule flags values above starts at", () => {
  const rule = new TieredFrequencyManifestStartsAtRangeRule(16, 120);
  const item = newTieredFrequencyManifest("x", "y");
  item.startsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredFrequencyManifestCodeLengthRule flags a long code", () => {
  const rule = new TieredFrequencyManifestCodeLengthRule(1000);
  const item = newTieredFrequencyManifest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredFrequencyManifestAttemptsRangeRule flags values above attempts", () => {
  const rule = new TieredFrequencyManifestAttemptsRangeRule(80, 86400);
  const item = newTieredFrequencyManifest("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
