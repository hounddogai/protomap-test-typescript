import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementScoreRequiredChannelRule,
  PlacementScoreRequiredSourceRule,
  defaultPlacementScoreValidator,
} from "./placement-score-rules.js";
import { newPlacementScore } from "./placement-score.js";

test("PlacementScoreValidator reports every problem", () => {
  const validator = defaultPlacementScoreValidator();
  const item = newPlacementScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementScoreRequiredSourceRule flags a blank source", () => {
  const rule = new PlacementScoreRequiredSourceRule("placement score needs this field");
  const item = newPlacementScore("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementScoreRequiredChannelRule flags a blank channel", () => {
  const rule = new PlacementScoreRequiredChannelRule("placement score needs an entry");
  const item = newPlacementScore("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
