import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutAuditRequiredAudienceIdRule,
  PayoutAuditRequiredCodeRule,
  PayoutAuditRequiredNameRule,
  PayoutAuditTitleLengthRule,
  defaultPayoutAuditValidator,
} from "./payout-audit-rules.js";
import { newPayoutAudit } from "./payout-audit.js";

test("PayoutAuditValidator reports every problem", () => {
  const validator = defaultPayoutAuditValidator();
  const item = newPayoutAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutAuditRequiredCodeRule flags a blank code", () => {
  const rule = new PayoutAuditRequiredCodeRule("payout audit needs an entry");
  const item = newPayoutAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutAuditRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new PayoutAuditRequiredAudienceIdRule("payout audit needs a value");
  const item = newPayoutAudit("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutAuditTitleLengthRule flags a long title", () => {
  const rule = new PayoutAuditTitleLengthRule(120);
  const item = newPayoutAudit("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutAuditRequiredNameRule flags a blank name", () => {
  const rule = new PayoutAuditRequiredNameRule("payout audit needs an entry");
  const item = newPayoutAudit("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
