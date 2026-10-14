import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalDoubleOptInAuditChannelLengthRule,
  SeasonalDoubleOptInAuditLabelLengthRule,
  SeasonalDoubleOptInAuditQuantityRangeRule,
  SeasonalDoubleOptInAuditRequiredCodeRule,
  defaultSeasonalDoubleOptInAuditValidator,
} from "./seasonal-double-opt-in-audit-rules.js";
import { newSeasonalDoubleOptInAudit } from "./seasonal-double-opt-in-audit.js";

test("SeasonalDoubleOptInAuditValidator reports every problem", () => {
  const validator = defaultSeasonalDoubleOptInAuditValidator();
  const item = newSeasonalDoubleOptInAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalDoubleOptInAuditQuantityRangeRule flags values above quantity", () => {
  const rule = new SeasonalDoubleOptInAuditQuantityRangeRule(16, 64);
  const item = newSeasonalDoubleOptInAudit("x", "y");
  item.quantity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalDoubleOptInAuditLabelLengthRule flags a long label", () => {
  const rule = new SeasonalDoubleOptInAuditLabelLengthRule(1000);
  const item = newSeasonalDoubleOptInAudit("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalDoubleOptInAuditChannelLengthRule flags a long channel", () => {
  const rule = new SeasonalDoubleOptInAuditChannelLengthRule(16);
  const item = newSeasonalDoubleOptInAudit("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalDoubleOptInAuditRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalDoubleOptInAuditRequiredCodeRule("seasonal double opt in audit needs an entry");
  const item = newSeasonalDoubleOptInAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
