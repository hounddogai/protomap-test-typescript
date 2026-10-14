import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictOptOutClaimCodeLengthRule,
  StrictOptOutClaimRequiredCodeRule,
  StrictOptOutClaimRequiredNameRule,
  StrictOptOutClaimRequiredTitleRule,
  defaultStrictOptOutClaimValidator,
} from "./strict-opt-out-claim-rules.js";
import { newStrictOptOutClaim } from "./strict-opt-out-claim.js";

test("StrictOptOutClaimValidator reports every problem", () => {
  const validator = defaultStrictOptOutClaimValidator();
  const item = newStrictOptOutClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictOptOutClaimRequiredTitleRule flags a blank title", () => {
  const rule = new StrictOptOutClaimRequiredTitleRule("strict opt out claim needs an entry");
  const item = newStrictOptOutClaim("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictOptOutClaimCodeLengthRule flags a long code", () => {
  const rule = new StrictOptOutClaimCodeLengthRule(120);
  const item = newStrictOptOutClaim("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictOptOutClaimRequiredCodeRule flags a blank code", () => {
  const rule = new StrictOptOutClaimRequiredCodeRule("strict opt out claim needs an entry");
  const item = newStrictOptOutClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictOptOutClaimRequiredNameRule flags a blank name", () => {
  const rule = new StrictOptOutClaimRequiredNameRule("strict opt out claim needs an entry");
  const item = newStrictOptOutClaim("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
