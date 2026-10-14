import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledFrequencyClaimBatchSizeRangeRule,
  ScheduledFrequencyClaimCeilingRangeRule,
  ScheduledFrequencyClaimCodeLengthRule,
  ScheduledFrequencyClaimLabelLengthRule,
  defaultScheduledFrequencyClaimValidator,
} from "./scheduled-frequency-claim-rules.js";
import { newScheduledFrequencyClaim } from "./scheduled-frequency-claim.js";

test("ScheduledFrequencyClaimValidator reports every problem", () => {
  const validator = defaultScheduledFrequencyClaimValidator();
  const item = newScheduledFrequencyClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledFrequencyClaimLabelLengthRule flags a long label", () => {
  const rule = new ScheduledFrequencyClaimLabelLengthRule(86400);
  const item = newScheduledFrequencyClaim("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledFrequencyClaimBatchSizeRangeRule flags values above batch size", () => {
  const rule = new ScheduledFrequencyClaimBatchSizeRangeRule(80, 120);
  const item = newScheduledFrequencyClaim("x", "y");
  item.batchSize = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledFrequencyClaimCeilingRangeRule flags values above ceiling", () => {
  const rule = new ScheduledFrequencyClaimCeilingRangeRule(9.7, 1200.4);
  const item = newScheduledFrequencyClaim("x", "y");
  item.ceiling = 1201.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledFrequencyClaimCodeLengthRule flags a long code", () => {
  const rule = new ScheduledFrequencyClaimCodeLengthRule(3600);
  const item = newScheduledFrequencyClaim("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
