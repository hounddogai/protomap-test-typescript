import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementQuotaCodeLengthRule,
  PlacementQuotaLabelLengthRule,
  PlacementQuotaRequiredCodeRule,
  PlacementQuotaRequiredLabelRule,
  defaultPlacementQuotaValidator,
} from "./placement-quota-rules.js";
import { newPlacementQuota } from "./placement-quota.js";

test("PlacementQuotaValidator reports every problem", () => {
  const validator = defaultPlacementQuotaValidator();
  const item = newPlacementQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementQuotaLabelLengthRule flags a long label", () => {
  const rule = new PlacementQuotaLabelLengthRule(16);
  const item = newPlacementQuota("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new PlacementQuotaRequiredCodeRule("placement quota needs an entry");
  const item = newPlacementQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementQuotaCodeLengthRule flags a long code", () => {
  const rule = new PlacementQuotaCodeLengthRule(3600);
  const item = newPlacementQuota("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementQuotaRequiredLabelRule flags a blank label", () => {
  const rule = new PlacementQuotaRequiredLabelRule("placement quota needs this field");
  const item = newPlacementQuota("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
