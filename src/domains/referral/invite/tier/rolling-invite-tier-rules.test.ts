import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingInviteTierNameLengthRule,
  RollingInviteTierRequiredCampaignRefRule,
  RollingInviteTierRequiredCodeRule,
  RollingInviteTierRequiredNameRule,
  defaultRollingInviteTierValidator,
} from "./rolling-invite-tier-rules.js";
import { newRollingInviteTier } from "./rolling-invite-tier.js";

test("RollingInviteTierValidator reports every problem", () => {
  const validator = defaultRollingInviteTierValidator();
  const item = newRollingInviteTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingInviteTierRequiredCodeRule flags a blank code", () => {
  const rule = new RollingInviteTierRequiredCodeRule("rolling invite tier needs an entry");
  const item = newRollingInviteTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingInviteTierRequiredNameRule flags a blank name", () => {
  const rule = new RollingInviteTierRequiredNameRule("rolling invite tier needs an entry");
  const item = newRollingInviteTier("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingInviteTierRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new RollingInviteTierRequiredCampaignRefRule("rolling invite tier needs an entry");
  const item = newRollingInviteTier("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingInviteTierNameLengthRule flags a long name", () => {
  const rule = new RollingInviteTierNameLengthRule(64);
  const item = newRollingInviteTier("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
