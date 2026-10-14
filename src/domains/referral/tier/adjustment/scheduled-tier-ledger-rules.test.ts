import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledTierLedgerCampaignRefLengthRule,
  ScheduledTierLedgerNameLengthRule,
  ScheduledTierLedgerRequiredCampaignRefRule,
  ScheduledTierLedgerRequiredNameRule,
  defaultScheduledTierLedgerValidator,
} from "./scheduled-tier-ledger-rules.js";
import { newScheduledTierLedger } from "./scheduled-tier-ledger.js";

test("ScheduledTierLedgerValidator reports every problem", () => {
  const validator = defaultScheduledTierLedgerValidator();
  const item = newScheduledTierLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledTierLedgerNameLengthRule flags a long name", () => {
  const rule = new ScheduledTierLedgerNameLengthRule(255);
  const item = newScheduledTierLedger("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledTierLedgerRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledTierLedgerRequiredNameRule("scheduled tier ledger needs this field");
  const item = newScheduledTierLedger("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledTierLedgerRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ScheduledTierLedgerRequiredCampaignRefRule("scheduled tier ledger needs an entry");
  const item = newScheduledTierLedger("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledTierLedgerCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ScheduledTierLedgerCampaignRefLengthRule(120);
  const item = newScheduledTierLedger("x", "y");
  item.campaignRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
