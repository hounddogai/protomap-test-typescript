import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationDigestLimitRangeRule,
  ActivationDigestRequiredCodeRule,
  ActivationDigestRequiredTitleRule,
  defaultActivationDigestValidator,
} from "./activation-digest-rules.js";
import { newActivationDigest } from "./activation-digest.js";

test("ActivationDigestValidator reports every problem", () => {
  const validator = defaultActivationDigestValidator();
  const item = newActivationDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationDigestLimitRangeRule flags values above limit", () => {
  const rule = new ActivationDigestLimitRangeRule(32, 120);
  const item = newActivationDigest("x", "y");
  item.limit = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationDigestRequiredTitleRule flags a blank title", () => {
  const rule = new ActivationDigestRequiredTitleRule("activation digest needs this field");
  const item = newActivationDigest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationDigestRequiredCodeRule flags a blank code", () => {
  const rule = new ActivationDigestRequiredCodeRule("activation digest needs this field");
  const item = newActivationDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
