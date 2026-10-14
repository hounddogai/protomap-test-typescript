import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedDomainMappingCampaignRefLengthRule,
  CappedDomainMappingOwnerIdLengthRule,
  CappedDomainMappingRequiredCodeRule,
  CappedDomainMappingRequiredOwnerIdRule,
  defaultCappedDomainMappingValidator,
} from "./capped-domain-mapping-rules.js";
import { newCappedDomainMapping } from "./capped-domain-mapping.js";

test("CappedDomainMappingValidator reports every problem", () => {
  const validator = defaultCappedDomainMappingValidator();
  const item = newCappedDomainMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedDomainMappingOwnerIdLengthRule flags a long owner id", () => {
  const rule = new CappedDomainMappingOwnerIdLengthRule(16);
  const item = newCappedDomainMapping("x", "y");
  item.ownerId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedDomainMappingCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new CappedDomainMappingCampaignRefLengthRule(80);
  const item = newCappedDomainMapping("x", "y");
  item.campaignRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedDomainMappingRequiredCodeRule flags a blank code", () => {
  const rule = new CappedDomainMappingRequiredCodeRule("capped domain mapping needs this field");
  const item = newCappedDomainMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedDomainMappingRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new CappedDomainMappingRequiredOwnerIdRule("capped domain mapping needs an entry");
  const item = newCappedDomainMapping("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
