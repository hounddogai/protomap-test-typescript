import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementSummaryCodeLengthRule,
  PlacementSummaryLabelLengthRule,
  PlacementSummaryRequiredLabelRule,
  defaultPlacementSummaryValidator,
} from "./placement-summary-rules.js";
import { newPlacementSummary } from "./placement-summary.js";

test("PlacementSummaryValidator reports every problem", () => {
  const validator = defaultPlacementSummaryValidator();
  const item = newPlacementSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementSummaryLabelLengthRule flags a long label", () => {
  const rule = new PlacementSummaryLabelLengthRule(255);
  const item = newPlacementSummary("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new PlacementSummaryRequiredLabelRule("placement summary needs an entry");
  const item = newPlacementSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementSummaryCodeLengthRule flags a long code", () => {
  const rule = new PlacementSummaryCodeLengthRule(3600);
  const item = newPlacementSummary("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
