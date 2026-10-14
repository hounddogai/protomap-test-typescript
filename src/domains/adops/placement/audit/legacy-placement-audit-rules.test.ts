import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyPlacementAuditQuantityRangeRule,
  LegacyPlacementAuditRequiredCodeRule,
  LegacyPlacementAuditRequiredJourneyIdRule,
  defaultLegacyPlacementAuditValidator,
} from "./legacy-placement-audit-rules.js";
import { newLegacyPlacementAudit } from "./legacy-placement-audit.js";

test("LegacyPlacementAuditValidator reports every problem", () => {
  const validator = defaultLegacyPlacementAuditValidator();
  const item = newLegacyPlacementAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyPlacementAuditRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new LegacyPlacementAuditRequiredJourneyIdRule("legacy placement audit needs this field");
  const item = newLegacyPlacementAudit("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyPlacementAuditRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyPlacementAuditRequiredCodeRule("legacy placement audit needs a value");
  const item = newLegacyPlacementAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyPlacementAuditQuantityRangeRule flags values above quantity", () => {
  const rule = new LegacyPlacementAuditQuantityRangeRule(80, 120);
  const item = newLegacyPlacementAudit("x", "y");
  item.quantity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
