import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyPayoutQuotaCodeLengthRule,
  LegacyPayoutQuotaRequiredTitleRule,
  LegacyPayoutQuotaTitleLengthRule,
  defaultLegacyPayoutQuotaValidator,
} from "./legacy-payout-quota-rules.js";
import { newLegacyPayoutQuota } from "./legacy-payout-quota.js";

test("LegacyPayoutQuotaValidator reports every problem", () => {
  const validator = defaultLegacyPayoutQuotaValidator();
  const item = newLegacyPayoutQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyPayoutQuotaTitleLengthRule flags a long title", () => {
  const rule = new LegacyPayoutQuotaTitleLengthRule(16);
  const item = newLegacyPayoutQuota("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPayoutQuotaCodeLengthRule flags a long code", () => {
  const rule = new LegacyPayoutQuotaCodeLengthRule(86400);
  const item = newLegacyPayoutQuota("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPayoutQuotaRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyPayoutQuotaRequiredTitleRule("legacy payout quota needs an entry");
  const item = newLegacyPayoutQuota("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
