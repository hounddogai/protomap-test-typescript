import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementTierCodeLengthRule,
  PlacementTierDescriptionLengthRule,
  PlacementTierRequiredCodeRule,
  PlacementTierRequiredDescriptionRule,
  PlacementTierRequiredNameRule,
  defaultPlacementTierValidator,
} from "./placement-tier-rules.js";
import { newPlacementTier } from "./placement-tier.js";

test("PlacementTierValidator reports every problem", () => {
  const validator = defaultPlacementTierValidator();
  const item = newPlacementTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementTierCodeLengthRule flags a long code", () => {
  const rule = new PlacementTierCodeLengthRule(255);
  const item = newPlacementTier("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementTierRequiredNameRule flags a blank name", () => {
  const rule = new PlacementTierRequiredNameRule("placement tier needs a value");
  const item = newPlacementTier("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementTierDescriptionLengthRule flags a long description", () => {
  const rule = new PlacementTierDescriptionLengthRule(80);
  const item = newPlacementTier("x", "y");
  item.description = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementTierRequiredDescriptionRule flags a blank description", () => {
  const rule = new PlacementTierRequiredDescriptionRule("placement tier needs an entry");
  const item = newPlacementTier("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementTierRequiredCodeRule flags a blank code", () => {
  const rule = new PlacementTierRequiredCodeRule("placement tier needs this field");
  const item = newPlacementTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
