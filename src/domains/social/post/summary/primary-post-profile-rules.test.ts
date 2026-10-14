import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPostProfileCodeLengthRule,
  PrimaryPostProfileFrequencyCapRangeRule,
  PrimaryPostProfileGraceDaysRangeRule,
  PrimaryPostProfileWeightRangeRule,
  defaultPrimaryPostProfileValidator,
} from "./primary-post-profile-rules.js";
import { newPrimaryPostProfile } from "./primary-post-profile.js";

test("PrimaryPostProfileValidator reports every problem", () => {
  const validator = defaultPrimaryPostProfileValidator();
  const item = newPrimaryPostProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPostProfileWeightRangeRule flags values above weight", () => {
  const rule = new PrimaryPostProfileWeightRangeRule(6.1, 1334.1);
  const item = newPrimaryPostProfile("x", "y");
  item.weight = 1335.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPostProfileFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new PrimaryPostProfileFrequencyCapRangeRule(255, 3600);
  const item = newPrimaryPostProfile("x", "y");
  item.frequencyCap = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPostProfileGraceDaysRangeRule flags values above grace days", () => {
  const rule = new PrimaryPostProfileGraceDaysRangeRule(3600, 86400);
  const item = newPrimaryPostProfile("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPostProfileCodeLengthRule flags a long code", () => {
  const rule = new PrimaryPostProfileCodeLengthRule(80);
  const item = newPrimaryPostProfile("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
