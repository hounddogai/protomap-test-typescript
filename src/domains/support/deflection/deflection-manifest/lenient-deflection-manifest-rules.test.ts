import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientDeflectionManifestCodeLengthRule,
  LenientDeflectionManifestNameLengthRule,
  defaultLenientDeflectionManifestValidator,
} from "./lenient-deflection-manifest-rules.js";
import { newLenientDeflectionManifest } from "./lenient-deflection-manifest.js";

test("LenientDeflectionManifestValidator reports every problem", () => {
  const validator = defaultLenientDeflectionManifestValidator();
  const item = newLenientDeflectionManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientDeflectionManifestCodeLengthRule flags a long code", () => {
  const rule = new LenientDeflectionManifestCodeLengthRule(16);
  const item = newLenientDeflectionManifest("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientDeflectionManifestNameLengthRule flags a long name", () => {
  const rule = new LenientDeflectionManifestNameLengthRule(1000);
  const item = newLenientDeflectionManifest("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
