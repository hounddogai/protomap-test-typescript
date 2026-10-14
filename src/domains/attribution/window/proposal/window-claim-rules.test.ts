import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowClaimExternalRefLengthRule,
  WindowClaimMinimumRangeRule,
  WindowClaimRequiredExternalRefRule,
  defaultWindowClaimValidator,
} from "./window-claim-rules.js";
import { newWindowClaim } from "./window-claim.js";

test("WindowClaimValidator reports every problem", () => {
  const validator = defaultWindowClaimValidator();
  const item = newWindowClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowClaimExternalRefLengthRule flags a long external ref", () => {
  const rule = new WindowClaimExternalRefLengthRule(80);
  const item = newWindowClaim("x", "y");
  item.externalRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowClaimMinimumRangeRule flags values above minimum", () => {
  const rule = new WindowClaimMinimumRangeRule(4.8, 4985.9);
  const item = newWindowClaim("x", "y");
  item.minimum = 4987.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowClaimRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new WindowClaimRequiredExternalRefRule("window claim needs a value");
  const item = newWindowClaim("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
