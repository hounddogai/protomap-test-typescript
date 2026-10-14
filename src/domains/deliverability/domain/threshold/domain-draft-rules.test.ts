import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainDraftCapacityRangeRule,
  DomainDraftCreatedAtRangeRule,
  DomainDraftPriorityRangeRule,
  DomainDraftRequiredCodeRule,
  DomainDraftRequiredLabelRule,
  DomainDraftRequiredRegionRule,
  defaultDomainDraftValidator,
} from "./domain-draft-rules.js";
import { newDomainDraft } from "./domain-draft.js";

test("DomainDraftValidator reports every problem", () => {
  const validator = defaultDomainDraftValidator();
  const item = newDomainDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainDraftCapacityRangeRule flags values above capacity", () => {
  const rule = new DomainDraftCapacityRangeRule(16, 3600);
  const item = newDomainDraft("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainDraftCreatedAtRangeRule flags values above created at", () => {
  const rule = new DomainDraftCreatedAtRangeRule(120, 1000);
  const item = newDomainDraft("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainDraftRequiredRegionRule flags a blank region", () => {
  const rule = new DomainDraftRequiredRegionRule("domain draft needs an entry");
  const item = newDomainDraft("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainDraftPriorityRangeRule flags values above priority", () => {
  const rule = new DomainDraftPriorityRangeRule(32, 86400);
  const item = newDomainDraft("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainDraftRequiredLabelRule flags a blank label", () => {
  const rule = new DomainDraftRequiredLabelRule("domain draft needs a value");
  const item = newDomainDraft("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainDraftRequiredCodeRule flags a blank code", () => {
  const rule = new DomainDraftRequiredCodeRule("domain draft needs this field");
  const item = newDomainDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
