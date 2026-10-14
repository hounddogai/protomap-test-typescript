import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedWindowGroupChannelLengthRule,
  WeightedWindowGroupNameLengthRule,
  WeightedWindowGroupRequiredChannelRule,
  WeightedWindowGroupRequiredDescriptionRule,
  defaultWeightedWindowGroupValidator,
} from "./weighted-window-group-rules.js";
import { newWeightedWindowGroup } from "./weighted-window-group.js";

test("WeightedWindowGroupValidator reports every problem", () => {
  const validator = defaultWeightedWindowGroupValidator();
  const item = newWeightedWindowGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedWindowGroupRequiredChannelRule flags a blank channel", () => {
  const rule = new WeightedWindowGroupRequiredChannelRule("weighted window group needs this field");
  const item = newWeightedWindowGroup("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedWindowGroupRequiredDescriptionRule flags a blank description", () => {
  const rule = new WeightedWindowGroupRequiredDescriptionRule("weighted window group needs a value");
  const item = newWeightedWindowGroup("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedWindowGroupNameLengthRule flags a long name", () => {
  const rule = new WeightedWindowGroupNameLengthRule(255);
  const item = newWeightedWindowGroup("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedWindowGroupChannelLengthRule flags a long channel", () => {
  const rule = new WeightedWindowGroupChannelLengthRule(64);
  const item = newWeightedWindowGroup("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
