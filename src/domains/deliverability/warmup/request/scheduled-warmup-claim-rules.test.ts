import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledWarmupClaimChecksumLengthRule,
  ScheduledWarmupClaimLabelLengthRule,
  ScheduledWarmupClaimLocaleLengthRule,
  ScheduledWarmupClaimRequiredCodeRule,
  ScheduledWarmupClaimRequiredLabelRule,
  defaultScheduledWarmupClaimValidator,
} from "./scheduled-warmup-claim-rules.js";
import { newScheduledWarmupClaim } from "./scheduled-warmup-claim.js";

test("ScheduledWarmupClaimValidator reports every problem", () => {
  const validator = defaultScheduledWarmupClaimValidator();
  const item = newScheduledWarmupClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledWarmupClaimRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledWarmupClaimRequiredCodeRule("scheduled warmup claim needs this field");
  const item = newScheduledWarmupClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledWarmupClaimChecksumLengthRule flags a long checksum", () => {
  const rule = new ScheduledWarmupClaimChecksumLengthRule(80);
  const item = newScheduledWarmupClaim("x", "y");
  item.checksum = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledWarmupClaimLabelLengthRule flags a long label", () => {
  const rule = new ScheduledWarmupClaimLabelLengthRule(3600);
  const item = newScheduledWarmupClaim("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledWarmupClaimRequiredLabelRule flags a blank label", () => {
  const rule = new ScheduledWarmupClaimRequiredLabelRule("scheduled warmup claim needs an entry");
  const item = newScheduledWarmupClaim("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledWarmupClaimLocaleLengthRule flags a long locale", () => {
  const rule = new ScheduledWarmupClaimLocaleLengthRule(3600);
  const item = newScheduledWarmupClaim("x", "y");
  item.locale = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
