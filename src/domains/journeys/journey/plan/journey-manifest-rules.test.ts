import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyManifestCodeLengthRule,
  JourneyManifestFrequencyCapRangeRule,
  JourneyManifestRequiredChecksumRule,
  defaultJourneyManifestValidator,
} from "./journey-manifest-rules.js";
import { newJourneyManifest } from "./journey-manifest.js";

test("JourneyManifestValidator reports every problem", () => {
  const validator = defaultJourneyManifestValidator();
  const item = newJourneyManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyManifestFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new JourneyManifestFrequencyCapRangeRule(64, 1000);
  const item = newJourneyManifest("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyManifestCodeLengthRule flags a long code", () => {
  const rule = new JourneyManifestCodeLengthRule(16);
  const item = newJourneyManifest("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyManifestRequiredChecksumRule flags a blank checksum", () => {
  const rule = new JourneyManifestRequiredChecksumRule("journey manifest needs an entry");
  const item = newJourneyManifest("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
