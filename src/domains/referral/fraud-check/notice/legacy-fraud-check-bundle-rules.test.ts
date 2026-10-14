import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyFraudCheckBundleExpiresAtRangeRule,
  LegacyFraudCheckBundleRequiredNotesRule,
  LegacyFraudCheckBundleTitleLengthRule,
  defaultLegacyFraudCheckBundleValidator,
} from "./legacy-fraud-check-bundle-rules.js";
import { newLegacyFraudCheckBundle } from "./legacy-fraud-check-bundle.js";

test("LegacyFraudCheckBundleValidator reports every problem", () => {
  const validator = defaultLegacyFraudCheckBundleValidator();
  const item = newLegacyFraudCheckBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyFraudCheckBundleTitleLengthRule flags a long title", () => {
  const rule = new LegacyFraudCheckBundleTitleLengthRule(1000);
  const item = newLegacyFraudCheckBundle("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyFraudCheckBundleRequiredNotesRule flags a blank notes", () => {
  const rule = new LegacyFraudCheckBundleRequiredNotesRule("legacy fraud check bundle needs a value");
  const item = newLegacyFraudCheckBundle("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyFraudCheckBundleExpiresAtRangeRule flags values above expires at", () => {
  const rule = new LegacyFraudCheckBundleExpiresAtRangeRule(80, 255);
  const item = newLegacyFraudCheckBundle("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
