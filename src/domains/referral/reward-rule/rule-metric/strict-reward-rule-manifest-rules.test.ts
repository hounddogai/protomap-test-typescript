import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictRewardRuleManifestExternalRefLengthRule,
  StrictRewardRuleManifestFloorValueRangeRule,
  StrictRewardRuleManifestLabelLengthRule,
  StrictRewardRuleManifestRequiredLabelRule,
  defaultStrictRewardRuleManifestValidator,
} from "./strict-reward-rule-manifest-rules.js";
import { newStrictRewardRuleManifest } from "./strict-reward-rule-manifest.js";

test("StrictRewardRuleManifestValidator reports every problem", () => {
  const validator = defaultStrictRewardRuleManifestValidator();
  const item = newStrictRewardRuleManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictRewardRuleManifestRequiredLabelRule flags a blank label", () => {
  const rule = new StrictRewardRuleManifestRequiredLabelRule("strict reward rule manifest needs an entry");
  const item = newStrictRewardRuleManifest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictRewardRuleManifestFloorValueRangeRule flags values above floor value", () => {
  const rule = new StrictRewardRuleManifestFloorValueRangeRule(3.9, 1555.7);
  const item = newStrictRewardRuleManifest("x", "y");
  item.floorValue = 1557.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictRewardRuleManifestLabelLengthRule flags a long label", () => {
  const rule = new StrictRewardRuleManifestLabelLengthRule(3600);
  const item = newStrictRewardRuleManifest("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictRewardRuleManifestExternalRefLengthRule flags a long external ref", () => {
  const rule = new StrictRewardRuleManifestExternalRefLengthRule(3600);
  const item = newStrictRewardRuleManifest("x", "y");
  item.externalRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
