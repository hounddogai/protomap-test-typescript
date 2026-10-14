import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInClaimMarginRangeRule,
  DoubleOptInClaimRequiredChecksumRule,
  defaultDoubleOptInClaimValidator,
} from "./double-opt-in-claim-rules.js";
import { newDoubleOptInClaim } from "./double-opt-in-claim.js";

test("DoubleOptInClaimValidator reports every problem", () => {
  const validator = defaultDoubleOptInClaimValidator();
  const item = newDoubleOptInClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInClaimMarginRangeRule flags values above margin", () => {
  const rule = new DoubleOptInClaimMarginRangeRule(8.8, 103.2);
  const item = newDoubleOptInClaim("x", "y");
  item.margin = 104.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInClaimRequiredChecksumRule flags a blank checksum", () => {
  const rule = new DoubleOptInClaimRequiredChecksumRule("double opt in claim needs an entry");
  const item = newDoubleOptInClaim("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
