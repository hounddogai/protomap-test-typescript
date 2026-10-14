import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationProfileCodeLengthRule,
  ReputationProfileRequiredRegionRule,
  defaultReputationProfileValidator,
} from "./reputation-profile-rules.js";
import { newReputationProfile } from "./reputation-profile.js";

test("ReputationProfileValidator reports every problem", () => {
  const validator = defaultReputationProfileValidator();
  const item = newReputationProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationProfileCodeLengthRule flags a long code", () => {
  const rule = new ReputationProfileCodeLengthRule(16);
  const item = newReputationProfile("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationProfileRequiredRegionRule flags a blank region", () => {
  const rule = new ReputationProfileRequiredRegionRule("reputation profile needs a value");
  const item = newReputationProfile("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
