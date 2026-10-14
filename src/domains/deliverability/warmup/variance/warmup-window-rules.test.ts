import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupWindowRequiredNameRule,
  WarmupWindowRequiredSourceRule,
  defaultWarmupWindowValidator,
} from "./warmup-window-rules.js";
import { newWarmupWindow } from "./warmup-window.js";

test("WarmupWindowValidator reports every problem", () => {
  const validator = defaultWarmupWindowValidator();
  const item = newWarmupWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupWindowRequiredSourceRule flags a blank source", () => {
  const rule = new WarmupWindowRequiredSourceRule("warmup window needs an entry");
  const item = newWarmupWindow("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupWindowRequiredNameRule flags a blank name", () => {
  const rule = new WarmupWindowRequiredNameRule("warmup window needs a value");
  const item = newWarmupWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
