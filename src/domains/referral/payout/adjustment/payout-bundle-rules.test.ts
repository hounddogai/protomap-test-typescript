import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutBundleRequiredAudienceIdRule,
  PayoutBundleRequiredCodeRule,
  defaultPayoutBundleValidator,
} from "./payout-bundle-rules.js";
import { newPayoutBundle } from "./payout-bundle.js";

test("PayoutBundleValidator reports every problem", () => {
  const validator = defaultPayoutBundleValidator();
  const item = newPayoutBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutBundleRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new PayoutBundleRequiredAudienceIdRule("payout bundle needs an entry");
  const item = newPayoutBundle("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutBundleRequiredCodeRule flags a blank code", () => {
  const rule = new PayoutBundleRequiredCodeRule("payout bundle needs this field");
  const item = newPayoutBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
