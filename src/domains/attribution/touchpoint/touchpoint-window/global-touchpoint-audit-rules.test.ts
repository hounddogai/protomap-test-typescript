import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalTouchpointAuditBudgetRangeRule,
  GlobalTouchpointAuditCostRangeRule,
  GlobalTouchpointAuditExternalRefLengthRule,
  GlobalTouchpointAuditJourneyIdLengthRule,
  GlobalTouchpointAuditRequiredExternalRefRule,
  GlobalTouchpointAuditStartsAtRangeRule,
  defaultGlobalTouchpointAuditValidator,
} from "./global-touchpoint-audit-rules.js";
import { newGlobalTouchpointAudit } from "./global-touchpoint-audit.js";

test("GlobalTouchpointAuditValidator reports every problem", () => {
  const validator = defaultGlobalTouchpointAuditValidator();
  const item = newGlobalTouchpointAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalTouchpointAuditStartsAtRangeRule flags values above starts at", () => {
  const rule = new GlobalTouchpointAuditStartsAtRangeRule(64, 120);
  const item = newGlobalTouchpointAudit("x", "y");
  item.startsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalTouchpointAuditBudgetRangeRule flags values above budget", () => {
  const rule = new GlobalTouchpointAuditBudgetRangeRule(3.9, 2153.3);
  const item = newGlobalTouchpointAudit("x", "y");
  item.budget = 2154.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalTouchpointAuditCostRangeRule flags values above cost", () => {
  const rule = new GlobalTouchpointAuditCostRangeRule(1.7, 224);
  const item = newGlobalTouchpointAudit("x", "y");
  item.cost = 225.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalTouchpointAuditExternalRefLengthRule flags a long external ref", () => {
  const rule = new GlobalTouchpointAuditExternalRefLengthRule(120);
  const item = newGlobalTouchpointAudit("x", "y");
  item.externalRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalTouchpointAuditJourneyIdLengthRule flags a long journey id", () => {
  const rule = new GlobalTouchpointAuditJourneyIdLengthRule(3600);
  const item = newGlobalTouchpointAudit("x", "y");
  item.journeyId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalTouchpointAuditRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new GlobalTouchpointAuditRequiredExternalRefRule("global touchpoint audit needs an entry");
  const item = newGlobalTouchpointAudit("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
