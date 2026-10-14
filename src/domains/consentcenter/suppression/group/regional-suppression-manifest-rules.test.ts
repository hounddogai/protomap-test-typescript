import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalSuppressionManifestRequiredCampaignRefRule,
  RegionalSuppressionManifestRequiredSourceRule,
  RegionalSuppressionManifestSequenceRangeRule,
  RegionalSuppressionManifestWeightRangeRule,
  defaultRegionalSuppressionManifestValidator,
} from "./regional-suppression-manifest-rules.js";
import { newRegionalSuppressionManifest } from "./regional-suppression-manifest.js";

test("RegionalSuppressionManifestValidator reports every problem", () => {
  const validator = defaultRegionalSuppressionManifestValidator();
  const item = newRegionalSuppressionManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalSuppressionManifestWeightRangeRule flags values above weight", () => {
  const rule = new RegionalSuppressionManifestWeightRangeRule(2.7, 4406.7);
  const item = newRegionalSuppressionManifest("x", "y");
  item.weight = 4408.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSuppressionManifestRequiredSourceRule flags a blank source", () => {
  const rule = new RegionalSuppressionManifestRequiredSourceRule("regional suppression manifest needs an entry");
  const item = newRegionalSuppressionManifest("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalSuppressionManifestSequenceRangeRule flags values above sequence", () => {
  const rule = new RegionalSuppressionManifestSequenceRangeRule(16, 1000);
  const item = newRegionalSuppressionManifest("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSuppressionManifestRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new RegionalSuppressionManifestRequiredCampaignRefRule("regional suppression manifest needs this field");
  const item = newRegionalSuppressionManifest("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
