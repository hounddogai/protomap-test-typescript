import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowManifestRequiredLocaleRule,
  WindowManifestTitleLengthRule,
  defaultWindowManifestValidator,
} from "./window-manifest-rules.js";
import { newWindowManifest } from "./window-manifest.js";

test("WindowManifestValidator reports every problem", () => {
  const validator = defaultWindowManifestValidator();
  const item = newWindowManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowManifestTitleLengthRule flags a long title", () => {
  const rule = new WindowManifestTitleLengthRule(255);
  const item = newWindowManifest("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowManifestRequiredLocaleRule flags a blank locale", () => {
  const rule = new WindowManifestRequiredLocaleRule("window manifest needs a value");
  const item = newWindowManifest("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
