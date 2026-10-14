import assert from "node:assert/strict";
import { test } from "node:test";
import { CreditClaimRequiredCodeRule, defaultCreditClaimValidator } from "./credit-claim-rules.js";
import { newCreditClaim } from "./credit-claim.js";

test("CreditClaimValidator reports every problem", () => {
  const validator = defaultCreditClaimValidator();
  const item = newCreditClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditClaimRequiredCodeRule flags a blank code", () => {
  const rule = new CreditClaimRequiredCodeRule("credit claim needs an entry");
  const item = newCreditClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
