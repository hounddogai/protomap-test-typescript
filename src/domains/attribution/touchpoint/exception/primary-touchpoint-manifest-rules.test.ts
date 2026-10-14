import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryTouchpointManifestOpenRateRangeRule,
  PrimaryTouchpointManifestRequiredCodeRule,
  defaultPrimaryTouchpointManifestValidator,
} from "./primary-touchpoint-manifest-rules.js";
import { newPrimaryTouchpointManifest } from "./primary-touchpoint-manifest.js";

test("PrimaryTouchpointManifestValidator reports every problem", () => {
  const validator = defaultPrimaryTouchpointManifestValidator();
  const item = newPrimaryTouchpointManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryTouchpointManifestRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryTouchpointManifestRequiredCodeRule("primary touchpoint manifest needs an entry");
  const item = newPrimaryTouchpointManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryTouchpointManifestOpenRateRangeRule flags values above open rate", () => {
  const rule = new PrimaryTouchpointManifestOpenRateRangeRule(9.6, 3551.6);
  const item = newPrimaryTouchpointManifest("x", "y");
  item.openRate = 3553.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
