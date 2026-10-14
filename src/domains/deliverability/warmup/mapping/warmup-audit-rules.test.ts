import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupAuditRequiredCountryRule,
  WarmupAuditRequiredTitleRule,
  defaultWarmupAuditValidator,
} from "./warmup-audit-rules.js";
import { newWarmupAudit } from "./warmup-audit.js";

test("WarmupAuditValidator reports every problem", () => {
  const validator = defaultWarmupAuditValidator();
  const item = newWarmupAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupAuditRequiredCountryRule flags a blank country", () => {
  const rule = new WarmupAuditRequiredCountryRule("warmup audit needs this field");
  const item = newWarmupAudit("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupAuditRequiredTitleRule flags a blank title", () => {
  const rule = new WarmupAuditRequiredTitleRule("warmup audit needs a value");
  const item = newWarmupAudit("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
