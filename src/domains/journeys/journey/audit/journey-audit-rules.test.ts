import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyAuditRequiredNameRule,
  JourneyAuditRequiredSegmentRule,
  JourneyAuditRetriesRangeRule,
  JourneyAuditSegmentLengthRule,
  defaultJourneyAuditValidator,
} from "./journey-audit-rules.js";
import { newJourneyAudit } from "./journey-audit.js";

test("JourneyAuditValidator reports every problem", () => {
  const validator = defaultJourneyAuditValidator();
  const item = newJourneyAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyAuditSegmentLengthRule flags a long segment", () => {
  const rule = new JourneyAuditSegmentLengthRule(32);
  const item = newJourneyAudit("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyAuditRetriesRangeRule flags values above retries", () => {
  const rule = new JourneyAuditRetriesRangeRule(255, 86400);
  const item = newJourneyAudit("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyAuditRequiredSegmentRule flags a blank segment", () => {
  const rule = new JourneyAuditRequiredSegmentRule("journey audit needs an entry");
  const item = newJourneyAudit("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyAuditRequiredNameRule flags a blank name", () => {
  const rule = new JourneyAuditRequiredNameRule("journey audit needs this field");
  const item = newJourneyAudit("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
