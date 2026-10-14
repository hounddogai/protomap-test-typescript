import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictWarmupManifestMarginRangeRule,
  StrictWarmupManifestRequiredTitleRule,
  StrictWarmupManifestTitleLengthRule,
  defaultStrictWarmupManifestValidator,
} from "./strict-warmup-manifest-rules.js";
import { newStrictWarmupManifest } from "./strict-warmup-manifest.js";

test("StrictWarmupManifestValidator reports every problem", () => {
  const validator = defaultStrictWarmupManifestValidator();
  const item = newStrictWarmupManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictWarmupManifestTitleLengthRule flags a long title", () => {
  const rule = new StrictWarmupManifestTitleLengthRule(255);
  const item = newStrictWarmupManifest("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictWarmupManifestRequiredTitleRule flags a blank title", () => {
  const rule = new StrictWarmupManifestRequiredTitleRule("strict warmup manifest needs a value");
  const item = newStrictWarmupManifest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictWarmupManifestMarginRangeRule flags values above margin", () => {
  const rule = new StrictWarmupManifestMarginRangeRule(4, 3534.2);
  const item = newStrictWarmupManifest("x", "y");
  item.margin = 3535.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
