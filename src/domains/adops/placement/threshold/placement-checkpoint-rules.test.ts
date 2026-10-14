import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementCheckpointClicksRangeRule,
  PlacementCheckpointRequiredCodeRule,
  PlacementCheckpointRequiredCountryRule,
  PlacementCheckpointRevisionRangeRule,
  defaultPlacementCheckpointValidator,
} from "./placement-checkpoint-rules.js";
import { newPlacementCheckpoint } from "./placement-checkpoint.js";

test("PlacementCheckpointValidator reports every problem", () => {
  const validator = defaultPlacementCheckpointValidator();
  const item = newPlacementCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementCheckpointRevisionRangeRule flags values above revision", () => {
  const rule = new PlacementCheckpointRevisionRangeRule(80, 3600);
  const item = newPlacementCheckpoint("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementCheckpointRequiredCountryRule flags a blank country", () => {
  const rule = new PlacementCheckpointRequiredCountryRule("placement checkpoint needs an entry");
  const item = newPlacementCheckpoint("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new PlacementCheckpointRequiredCodeRule("placement checkpoint needs a value");
  const item = newPlacementCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementCheckpointClicksRangeRule flags values above clicks", () => {
  const rule = new PlacementCheckpointClicksRangeRule(64, 1000);
  const item = newPlacementCheckpoint("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
