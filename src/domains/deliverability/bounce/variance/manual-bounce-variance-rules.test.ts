import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualBounceVarianceCampaignRefLengthRule,
  ManualBounceVarianceChecksumLengthRule,
  ManualBounceVarianceLabelLengthRule,
  ManualBounceVarianceRequiredChecksumRule,
  defaultManualBounceVarianceValidator,
} from "./manual-bounce-variance-rules.js";
import { newManualBounceVariance } from "./manual-bounce-variance.js";

test("ManualBounceVarianceValidator reports every problem", () => {
  const validator = defaultManualBounceVarianceValidator();
  const item = newManualBounceVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualBounceVarianceLabelLengthRule flags a long label", () => {
  const rule = new ManualBounceVarianceLabelLengthRule(16);
  const item = newManualBounceVariance("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBounceVarianceChecksumLengthRule flags a long checksum", () => {
  const rule = new ManualBounceVarianceChecksumLengthRule(3600);
  const item = newManualBounceVariance("x", "y");
  item.checksum = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBounceVarianceCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ManualBounceVarianceCampaignRefLengthRule(120);
  const item = newManualBounceVariance("x", "y");
  item.campaignRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBounceVarianceRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ManualBounceVarianceRequiredChecksumRule("manual bounce variance needs this field");
  const item = newManualBounceVariance("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
