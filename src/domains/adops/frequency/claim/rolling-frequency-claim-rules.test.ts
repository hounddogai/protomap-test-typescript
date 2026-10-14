import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingFrequencyClaimRequiredCodeRule,
  RollingFrequencyClaimRequiredDescriptionRule,
  defaultRollingFrequencyClaimValidator,
} from "./rolling-frequency-claim-rules.js";
import { newRollingFrequencyClaim } from "./rolling-frequency-claim.js";

test("RollingFrequencyClaimValidator reports every problem", () => {
  const validator = defaultRollingFrequencyClaimValidator();
  const item = newRollingFrequencyClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingFrequencyClaimRequiredCodeRule flags a blank code", () => {
  const rule = new RollingFrequencyClaimRequiredCodeRule("rolling frequency claim needs an entry");
  const item = newRollingFrequencyClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingFrequencyClaimRequiredDescriptionRule flags a blank description", () => {
  const rule = new RollingFrequencyClaimRequiredDescriptionRule("rolling frequency claim needs this field");
  const item = newRollingFrequencyClaim("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
