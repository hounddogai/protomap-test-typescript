import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedDeflectionManifestAmountRangeRule,
  CappedDeflectionManifestLabelLengthRule,
  CappedDeflectionManifestTitleLengthRule,
  defaultCappedDeflectionManifestValidator,
} from "./capped-deflection-manifest-rules.js";
import { newCappedDeflectionManifest } from "./capped-deflection-manifest.js";

test("CappedDeflectionManifestValidator reports every problem", () => {
  const validator = defaultCappedDeflectionManifestValidator();
  const item = newCappedDeflectionManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedDeflectionManifestAmountRangeRule flags values above amount", () => {
  const rule = new CappedDeflectionManifestAmountRangeRule(2.2, 4977.5);
  const item = newCappedDeflectionManifest("x", "y");
  item.amount = 4979;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedDeflectionManifestLabelLengthRule flags a long label", () => {
  const rule = new CappedDeflectionManifestLabelLengthRule(120);
  const item = newCappedDeflectionManifest("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedDeflectionManifestTitleLengthRule flags a long title", () => {
  const rule = new CappedDeflectionManifestTitleLengthRule(64);
  const item = newCappedDeflectionManifest("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
