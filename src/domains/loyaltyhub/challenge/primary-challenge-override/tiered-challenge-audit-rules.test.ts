import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredChallengeAuditClicksRangeRule,
  TieredChallengeAuditLabelLengthRule,
  TieredChallengeAuditRequiredChannelRule,
  TieredChallengeAuditRequiredLabelRule,
  defaultTieredChallengeAuditValidator,
} from "./tiered-challenge-audit-rules.js";
import { newTieredChallengeAudit } from "./tiered-challenge-audit.js";

test("TieredChallengeAuditValidator reports every problem", () => {
  const validator = defaultTieredChallengeAuditValidator();
  const item = newTieredChallengeAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredChallengeAuditLabelLengthRule flags a long label", () => {
  const rule = new TieredChallengeAuditLabelLengthRule(80);
  const item = newTieredChallengeAudit("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredChallengeAuditRequiredChannelRule flags a blank channel", () => {
  const rule = new TieredChallengeAuditRequiredChannelRule("tiered challenge audit needs an entry");
  const item = newTieredChallengeAudit("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredChallengeAuditRequiredLabelRule flags a blank label", () => {
  const rule = new TieredChallengeAuditRequiredLabelRule("tiered challenge audit needs a value");
  const item = newTieredChallengeAudit("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredChallengeAuditClicksRangeRule flags values above clicks", () => {
  const rule = new TieredChallengeAuditClicksRangeRule(255, 255);
  const item = newTieredChallengeAudit("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
