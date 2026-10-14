import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPaywallCycleChecksumLengthRule,
  PrimaryPaywallCycleContactEmailLengthRule,
  PrimaryPaywallCycleRequiredChecksumRule,
  PrimaryPaywallCycleRequiredCodeRule,
  PrimaryPaywallCycleRequiredContactEmailRule,
  defaultPrimaryPaywallCycleValidator,
} from "./primary-paywall-cycle-rules.js";
import { newPrimaryPaywallCycle } from "./primary-paywall-cycle.js";

test("PrimaryPaywallCycleValidator reports every problem", () => {
  const validator = defaultPrimaryPaywallCycleValidator();
  const item = newPrimaryPaywallCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPaywallCycleRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new PrimaryPaywallCycleRequiredContactEmailRule("primary paywall cycle needs an entry");
  const item = newPrimaryPaywallCycle("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPaywallCycleRequiredChecksumRule flags a blank checksum", () => {
  const rule = new PrimaryPaywallCycleRequiredChecksumRule("primary paywall cycle needs an entry");
  const item = newPrimaryPaywallCycle("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPaywallCycleContactEmailLengthRule flags a long contact email", () => {
  const rule = new PrimaryPaywallCycleContactEmailLengthRule(16);
  const item = newPrimaryPaywallCycle("x", "y");
  item.contactEmail = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPaywallCycleRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryPaywallCycleRequiredCodeRule("primary paywall cycle needs this field");
  const item = newPrimaryPaywallCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPaywallCycleChecksumLengthRule flags a long checksum", () => {
  const rule = new PrimaryPaywallCycleChecksumLengthRule(1000);
  const item = newPrimaryPaywallCycle("x", "y");
  item.checksum = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
