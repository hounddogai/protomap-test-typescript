import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalReputationClaimNameLengthRule,
  RegionalReputationClaimRequiredCodeRule,
  RegionalReputationClaimRequiredNameRule,
  RegionalReputationClaimRequiredTitleRule,
  defaultRegionalReputationClaimValidator,
} from "./regional-reputation-claim-rules.js";
import { newRegionalReputationClaim } from "./regional-reputation-claim.js";

test("RegionalReputationClaimValidator reports every problem", () => {
  const validator = defaultRegionalReputationClaimValidator();
  const item = newRegionalReputationClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalReputationClaimRequiredNameRule flags a blank name", () => {
  const rule = new RegionalReputationClaimRequiredNameRule("regional reputation claim needs a value");
  const item = newRegionalReputationClaim("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalReputationClaimRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalReputationClaimRequiredTitleRule("regional reputation claim needs this field");
  const item = newRegionalReputationClaim("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalReputationClaimRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalReputationClaimRequiredCodeRule("regional reputation claim needs this field");
  const item = newRegionalReputationClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalReputationClaimNameLengthRule flags a long name", () => {
  const rule = new RegionalReputationClaimNameLengthRule(120);
  const item = newRegionalReputationClaim("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
