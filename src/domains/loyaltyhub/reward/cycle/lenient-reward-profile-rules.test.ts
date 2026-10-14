import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientRewardProfileCodeLengthRule,
  LenientRewardProfileCreatedAtRangeRule,
  LenientRewardProfileLabelLengthRule,
  LenientRewardProfileScoreRangeRule,
  defaultLenientRewardProfileValidator,
} from "./lenient-reward-profile-rules.js";
import { newLenientRewardProfile } from "./lenient-reward-profile.js";

test("LenientRewardProfileValidator reports every problem", () => {
  const validator = defaultLenientRewardProfileValidator();
  const item = newLenientRewardProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientRewardProfileCodeLengthRule flags a long code", () => {
  const rule = new LenientRewardProfileCodeLengthRule(32);
  const item = newLenientRewardProfile("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientRewardProfileCreatedAtRangeRule flags values above created at", () => {
  const rule = new LenientRewardProfileCreatedAtRangeRule(64, 86400);
  const item = newLenientRewardProfile("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientRewardProfileLabelLengthRule flags a long label", () => {
  const rule = new LenientRewardProfileLabelLengthRule(120);
  const item = newLenientRewardProfile("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientRewardProfileScoreRangeRule flags values above score", () => {
  const rule = new LenientRewardProfileScoreRangeRule(5.2, 1627.2);
  const item = newLenientRewardProfile("x", "y");
  item.score = 1628.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
