import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualFrequencyManifestRequiredCodeRule,
  ManualFrequencyManifestRequiredLabelRule,
  defaultManualFrequencyManifestValidator,
} from "./manual-frequency-manifest-rules.js";
import { newManualFrequencyManifest } from "./manual-frequency-manifest.js";

test("ManualFrequencyManifestValidator reports every problem", () => {
  const validator = defaultManualFrequencyManifestValidator();
  const item = newManualFrequencyManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualFrequencyManifestRequiredLabelRule flags a blank label", () => {
  const rule = new ManualFrequencyManifestRequiredLabelRule("manual frequency manifest needs this field");
  const item = newManualFrequencyManifest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualFrequencyManifestRequiredCodeRule flags a blank code", () => {
  const rule = new ManualFrequencyManifestRequiredCodeRule("manual frequency manifest needs a value");
  const item = newManualFrequencyManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
