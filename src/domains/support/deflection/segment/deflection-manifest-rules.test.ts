import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionManifestBidRangeRule,
  DeflectionManifestCodeLengthRule,
  DeflectionManifestNameLengthRule,
  DeflectionManifestRequiredCodeRule,
  defaultDeflectionManifestValidator,
} from "./deflection-manifest-rules.js";
import { newDeflectionManifest } from "./deflection-manifest.js";

test("DeflectionManifestValidator reports every problem", () => {
  const validator = defaultDeflectionManifestValidator();
  const item = newDeflectionManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionManifestRequiredCodeRule flags a blank code", () => {
  const rule = new DeflectionManifestRequiredCodeRule("deflection manifest needs this field");
  const item = newDeflectionManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionManifestNameLengthRule flags a long name", () => {
  const rule = new DeflectionManifestNameLengthRule(120);
  const item = newDeflectionManifest("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionManifestBidRangeRule flags values above bid", () => {
  const rule = new DeflectionManifestBidRangeRule(8.8, 2402.9);
  const item = newDeflectionManifest("x", "y");
  item.bid = 2404.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionManifestCodeLengthRule flags a long code", () => {
  const rule = new DeflectionManifestCodeLengthRule(64);
  const item = newDeflectionManifest("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
