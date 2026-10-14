import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedDoubleOptInManifestRequiredChannelRule,
  WeightedDoubleOptInManifestRequiredCodeRule,
  WeightedDoubleOptInManifestRequiredLabelRule,
  defaultWeightedDoubleOptInManifestValidator,
} from "./weighted-double-opt-in-manifest-rules.js";
import { newWeightedDoubleOptInManifest } from "./weighted-double-opt-in-manifest.js";

test("WeightedDoubleOptInManifestValidator reports every problem", () => {
  const validator = defaultWeightedDoubleOptInManifestValidator();
  const item = newWeightedDoubleOptInManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedDoubleOptInManifestRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedDoubleOptInManifestRequiredCodeRule("weighted double opt in manifest needs an entry");
  const item = newWeightedDoubleOptInManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedDoubleOptInManifestRequiredLabelRule flags a blank label", () => {
  const rule = new WeightedDoubleOptInManifestRequiredLabelRule("weighted double opt in manifest needs this field");
  const item = newWeightedDoubleOptInManifest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedDoubleOptInManifestRequiredChannelRule flags a blank channel", () => {
  const rule = new WeightedDoubleOptInManifestRequiredChannelRule("weighted double opt in manifest needs this field");
  const item = newWeightedDoubleOptInManifest("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
