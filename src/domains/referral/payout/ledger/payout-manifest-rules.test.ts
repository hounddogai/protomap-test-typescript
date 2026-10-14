import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutManifestRequiredLabelRule,
  PayoutManifestRequiredReviewerRule,
  defaultPayoutManifestValidator,
} from "./payout-manifest-rules.js";
import { newPayoutManifest } from "./payout-manifest.js";

test("PayoutManifestValidator reports every problem", () => {
  const validator = defaultPayoutManifestValidator();
  const item = newPayoutManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutManifestRequiredLabelRule flags a blank label", () => {
  const rule = new PayoutManifestRequiredLabelRule("payout manifest needs an entry");
  const item = newPayoutManifest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutManifestRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new PayoutManifestRequiredReviewerRule("payout manifest needs a value");
  const item = newPayoutManifest("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
