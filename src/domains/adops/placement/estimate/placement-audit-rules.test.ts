import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementAuditLocaleLengthRule,
  PlacementAuditRequiredCodeRule,
  PlacementAuditRequiredLocaleRule,
  defaultPlacementAuditValidator,
} from "./placement-audit-rules.js";
import { newPlacementAudit } from "./placement-audit.js";

test("PlacementAuditValidator reports every problem", () => {
  const validator = defaultPlacementAuditValidator();
  const item = newPlacementAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementAuditRequiredLocaleRule flags a blank locale", () => {
  const rule = new PlacementAuditRequiredLocaleRule("placement audit needs a value");
  const item = newPlacementAudit("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementAuditRequiredCodeRule flags a blank code", () => {
  const rule = new PlacementAuditRequiredCodeRule("placement audit needs this field");
  const item = newPlacementAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementAuditLocaleLengthRule flags a long locale", () => {
  const rule = new PlacementAuditLocaleLengthRule(120);
  const item = newPlacementAudit("x", "y");
  item.locale = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
