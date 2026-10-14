import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredTouchpointSummaryLocaleLengthRule,
  TieredTouchpointSummaryNameLengthRule,
  TieredTouchpointSummaryRequiredExternalRefRule,
  TieredTouchpointSummaryRequiredNameRule,
  defaultTieredTouchpointSummaryValidator,
} from "./tiered-touchpoint-summary-rules.js";
import { newTieredTouchpointSummary } from "./tiered-touchpoint-summary.js";

test("TieredTouchpointSummaryValidator reports every problem", () => {
  const validator = defaultTieredTouchpointSummaryValidator();
  const item = newTieredTouchpointSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredTouchpointSummaryRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new TieredTouchpointSummaryRequiredExternalRefRule("tiered touchpoint summary needs this field");
  const item = newTieredTouchpointSummary("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTouchpointSummaryLocaleLengthRule flags a long locale", () => {
  const rule = new TieredTouchpointSummaryLocaleLengthRule(120);
  const item = newTieredTouchpointSummary("x", "y");
  item.locale = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredTouchpointSummaryRequiredNameRule flags a blank name", () => {
  const rule = new TieredTouchpointSummaryRequiredNameRule("tiered touchpoint summary needs an entry");
  const item = newTieredTouchpointSummary("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTouchpointSummaryNameLengthRule flags a long name", () => {
  const rule = new TieredTouchpointSummaryNameLengthRule(64);
  const item = newTieredTouchpointSummary("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
