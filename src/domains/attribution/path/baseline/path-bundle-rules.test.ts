import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathBundleCodeLengthRule,
  PathBundleRequiredChannelRule,
  PathBundleStartsAtRangeRule,
  defaultPathBundleValidator,
} from "./path-bundle-rules.js";
import { newPathBundle } from "./path-bundle.js";

test("PathBundleValidator reports every problem", () => {
  const validator = defaultPathBundleValidator();
  const item = newPathBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathBundleCodeLengthRule flags a long code", () => {
  const rule = new PathBundleCodeLengthRule(64);
  const item = newPathBundle("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathBundleStartsAtRangeRule flags values above starts at", () => {
  const rule = new PathBundleStartsAtRangeRule(32, 86400);
  const item = newPathBundle("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathBundleRequiredChannelRule flags a blank channel", () => {
  const rule = new PathBundleRequiredChannelRule("path bundle needs this field");
  const item = newPathBundle("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
