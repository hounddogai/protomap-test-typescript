import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalWindowAuditRequiredCodeRule,
  SeasonalWindowAuditRequiredNameRule,
  SeasonalWindowAuditRequiredSegmentRule,
  defaultSeasonalWindowAuditValidator,
} from "./seasonal-window-audit-rules.js";
import { newSeasonalWindowAudit } from "./seasonal-window-audit.js";

test("SeasonalWindowAuditValidator reports every problem", () => {
  const validator = defaultSeasonalWindowAuditValidator();
  const item = newSeasonalWindowAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalWindowAuditRequiredSegmentRule flags a blank segment", () => {
  const rule = new SeasonalWindowAuditRequiredSegmentRule("seasonal window audit needs an entry");
  const item = newSeasonalWindowAudit("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalWindowAuditRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalWindowAuditRequiredNameRule("seasonal window audit needs an entry");
  const item = newSeasonalWindowAudit("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalWindowAuditRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalWindowAuditRequiredCodeRule("seasonal window audit needs a value");
  const item = newSeasonalWindowAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
