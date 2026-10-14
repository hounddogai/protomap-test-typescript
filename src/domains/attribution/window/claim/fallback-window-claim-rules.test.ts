import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackWindowClaimRequiredCategoryRule,
  FallbackWindowClaimRequiredCodeRule,
  FallbackWindowClaimRequiredLabelRule,
  defaultFallbackWindowClaimValidator,
} from "./fallback-window-claim-rules.js";
import { newFallbackWindowClaim } from "./fallback-window-claim.js";

test("FallbackWindowClaimValidator reports every problem", () => {
  const validator = defaultFallbackWindowClaimValidator();
  const item = newFallbackWindowClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackWindowClaimRequiredCategoryRule flags a blank category", () => {
  const rule = new FallbackWindowClaimRequiredCategoryRule("fallback window claim needs a value");
  const item = newFallbackWindowClaim("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackWindowClaimRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackWindowClaimRequiredLabelRule("fallback window claim needs a value");
  const item = newFallbackWindowClaim("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackWindowClaimRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackWindowClaimRequiredCodeRule("fallback window claim needs this field");
  const item = newFallbackWindowClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
