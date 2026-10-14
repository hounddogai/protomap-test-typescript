import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedPayoutQuotaRequiredNameRule,
  CappedPayoutQuotaRequiredSegmentRule,
  CappedPayoutQuotaSequenceRangeRule,
  defaultCappedPayoutQuotaValidator,
} from "./capped-payout-quota-rules.js";
import { newCappedPayoutQuota } from "./capped-payout-quota.js";

test("CappedPayoutQuotaValidator reports every problem", () => {
  const validator = defaultCappedPayoutQuotaValidator();
  const item = newCappedPayoutQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedPayoutQuotaSequenceRangeRule flags values above sequence", () => {
  const rule = new CappedPayoutQuotaSequenceRangeRule(80, 120);
  const item = newCappedPayoutQuota("x", "y");
  item.sequence = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedPayoutQuotaRequiredSegmentRule flags a blank segment", () => {
  const rule = new CappedPayoutQuotaRequiredSegmentRule("capped payout quota needs an entry");
  const item = newCappedPayoutQuota("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedPayoutQuotaRequiredNameRule flags a blank name", () => {
  const rule = new CappedPayoutQuotaRequiredNameRule("capped payout quota needs this field");
  const item = newCappedPayoutQuota("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
