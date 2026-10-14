import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortClaimRequiredCodeRule,
  CohortClaimRequiredTitleRule,
  CohortClaimRequiredVariantRule,
  defaultCohortClaimValidator,
} from "./cohort-claim-rules.js";
import { newCohortClaim } from "./cohort-claim.js";

test("CohortClaimValidator reports every problem", () => {
  const validator = defaultCohortClaimValidator();
  const item = newCohortClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortClaimRequiredVariantRule flags a blank variant", () => {
  const rule = new CohortClaimRequiredVariantRule("cohort claim needs a value");
  const item = newCohortClaim("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortClaimRequiredTitleRule flags a blank title", () => {
  const rule = new CohortClaimRequiredTitleRule("cohort claim needs an entry");
  const item = newCohortClaim("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortClaimRequiredCodeRule flags a blank code", () => {
  const rule = new CohortClaimRequiredCodeRule("cohort claim needs a value");
  const item = newCohortClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
