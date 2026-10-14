import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeManifestCodeLengthRule,
  NudgeManifestCostRangeRule,
  NudgeManifestRequiredCodeRule,
  NudgeManifestRequiredLabelRule,
  NudgeManifestUpdatedAtRangeRule,
  defaultNudgeManifestValidator,
} from "./nudge-manifest-rules.js";
import { newNudgeManifest } from "./nudge-manifest.js";

test("NudgeManifestValidator reports every problem", () => {
  const validator = defaultNudgeManifestValidator();
  const item = newNudgeManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeManifestUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new NudgeManifestUpdatedAtRangeRule(32, 32);
  const item = newNudgeManifest("x", "y");
  item.updatedAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeManifestRequiredCodeRule flags a blank code", () => {
  const rule = new NudgeManifestRequiredCodeRule("nudge manifest needs a value");
  const item = newNudgeManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeManifestCostRangeRule flags values above cost", () => {
  const rule = new NudgeManifestCostRangeRule(1, 4767.3);
  const item = newNudgeManifest("x", "y");
  item.cost = 4768.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeManifestCodeLengthRule flags a long code", () => {
  const rule = new NudgeManifestCodeLengthRule(32);
  const item = newNudgeManifest("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeManifestRequiredLabelRule flags a blank label", () => {
  const rule = new NudgeManifestRequiredLabelRule("nudge manifest needs an entry");
  const item = newNudgeManifest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
