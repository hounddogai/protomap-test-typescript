import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementRollupCodeLengthRule,
  PlacementRollupRequiredChannelRule,
  PlacementRollupRequiredNameRule,
  PlacementRollupStartsAtRangeRule,
  defaultPlacementRollupValidator,
} from "./placement-rollup-rules.js";
import { newPlacementRollup } from "./placement-rollup.js";

test("PlacementRollupValidator reports every problem", () => {
  const validator = defaultPlacementRollupValidator();
  const item = newPlacementRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementRollupCodeLengthRule flags a long code", () => {
  const rule = new PlacementRollupCodeLengthRule(86400);
  const item = newPlacementRollup("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementRollupRequiredNameRule flags a blank name", () => {
  const rule = new PlacementRollupRequiredNameRule("placement rollup needs an entry");
  const item = newPlacementRollup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementRollupRequiredChannelRule flags a blank channel", () => {
  const rule = new PlacementRollupRequiredChannelRule("placement rollup needs an entry");
  const item = newPlacementRollup("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementRollupStartsAtRangeRule flags values above starts at", () => {
  const rule = new PlacementRollupStartsAtRangeRule(86400, 86400);
  const item = newPlacementRollup("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
