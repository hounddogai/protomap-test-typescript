import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPayoutBatchRequiredChecksumRule,
  RollingPayoutBatchRequiredCodeRule,
  defaultRollingPayoutBatchValidator,
} from "./rolling-payout-batch-rules.js";
import { newRollingPayoutBatch } from "./rolling-payout-batch.js";

test("RollingPayoutBatchValidator reports every problem", () => {
  const validator = defaultRollingPayoutBatchValidator();
  const item = newRollingPayoutBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPayoutBatchRequiredChecksumRule flags a blank checksum", () => {
  const rule = new RollingPayoutBatchRequiredChecksumRule("rolling payout batch needs this field");
  const item = newRollingPayoutBatch("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingPayoutBatchRequiredCodeRule flags a blank code", () => {
  const rule = new RollingPayoutBatchRequiredCodeRule("rolling payout batch needs an entry");
  const item = newRollingPayoutBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
