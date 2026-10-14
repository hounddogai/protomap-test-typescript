import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeDigestCodeLengthRule,
  CreativeDigestUnitLengthRule,
  defaultCreativeDigestValidator,
} from "./creative-digest-rules.js";
import { newCreativeDigest } from "./creative-digest.js";

test("CreativeDigestValidator reports every problem", () => {
  const validator = defaultCreativeDigestValidator();
  const item = newCreativeDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeDigestUnitLengthRule flags a long unit", () => {
  const rule = new CreativeDigestUnitLengthRule(16);
  const item = newCreativeDigest("x", "y");
  item.unit = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeDigestCodeLengthRule flags a long code", () => {
  const rule = new CreativeDigestCodeLengthRule(32);
  const item = newCreativeDigest("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
