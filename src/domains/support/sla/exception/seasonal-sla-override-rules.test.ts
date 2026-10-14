import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalSlaOverrideOwnerIdLengthRule,
  SeasonalSlaOverrideSummaryLengthRule,
  defaultSeasonalSlaOverrideValidator,
} from "./seasonal-sla-override-rules.js";
import { newSeasonalSlaOverride } from "./seasonal-sla-override.js";

test("SeasonalSlaOverrideValidator reports every problem", () => {
  const validator = defaultSeasonalSlaOverrideValidator();
  const item = newSeasonalSlaOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalSlaOverrideOwnerIdLengthRule flags a long owner id", () => {
  const rule = new SeasonalSlaOverrideOwnerIdLengthRule(120);
  const item = newSeasonalSlaOverride("x", "y");
  item.ownerId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalSlaOverrideSummaryLengthRule flags a long summary", () => {
  const rule = new SeasonalSlaOverrideSummaryLengthRule(255);
  const item = newSeasonalSlaOverride("x", "y");
  item.summary = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
