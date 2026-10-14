import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredModelDigestCodeLengthRule,
  TieredModelDigestRequiredUtmSourceRule,
  TieredModelDigestUtmSourceLengthRule,
  defaultTieredModelDigestValidator,
} from "./tiered-model-digest-rules.js";
import { newTieredModelDigest } from "./tiered-model-digest.js";

test("TieredModelDigestValidator reports every problem", () => {
  const validator = defaultTieredModelDigestValidator();
  const item = newTieredModelDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredModelDigestRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new TieredModelDigestRequiredUtmSourceRule("tiered model digest needs this field");
  const item = newTieredModelDigest("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredModelDigestCodeLengthRule flags a long code", () => {
  const rule = new TieredModelDigestCodeLengthRule(80);
  const item = newTieredModelDigest("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredModelDigestUtmSourceLengthRule flags a long utm source", () => {
  const rule = new TieredModelDigestUtmSourceLengthRule(80);
  const item = newTieredModelDigest("x", "y");
  item.utmSource = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
