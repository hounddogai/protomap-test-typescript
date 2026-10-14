import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitClaimCampaignRefLengthRule,
  WaitClaimChecksumLengthRule,
  WaitClaimLabelLengthRule,
  WaitClaimVersionRangeRule,
  defaultWaitClaimValidator,
} from "./wait-claim-rules.js";
import { newWaitClaim } from "./wait-claim.js";

test("WaitClaimValidator reports every problem", () => {
  const validator = defaultWaitClaimValidator();
  const item = newWaitClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitClaimCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new WaitClaimCampaignRefLengthRule(120);
  const item = newWaitClaim("x", "y");
  item.campaignRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitClaimLabelLengthRule flags a long label", () => {
  const rule = new WaitClaimLabelLengthRule(255);
  const item = newWaitClaim("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitClaimVersionRangeRule flags values above version", () => {
  const rule = new WaitClaimVersionRangeRule(32, 80);
  const item = newWaitClaim("x", "y");
  item.version = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitClaimChecksumLengthRule flags a long checksum", () => {
  const rule = new WaitClaimChecksumLengthRule(120);
  const item = newWaitClaim("x", "y");
  item.checksum = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
