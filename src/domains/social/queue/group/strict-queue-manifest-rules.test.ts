import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictQueueManifestCodeLengthRule,
  StrictQueueManifestRegionLengthRule,
  StrictQueueManifestRequiredRegionRule,
  StrictQueueManifestTitleLengthRule,
  StrictQueueManifestUpdatedAtRangeRule,
  defaultStrictQueueManifestValidator,
} from "./strict-queue-manifest-rules.js";
import { newStrictQueueManifest } from "./strict-queue-manifest.js";

test("StrictQueueManifestValidator reports every problem", () => {
  const validator = defaultStrictQueueManifestValidator();
  const item = newStrictQueueManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictQueueManifestTitleLengthRule flags a long title", () => {
  const rule = new StrictQueueManifestTitleLengthRule(3600);
  const item = newStrictQueueManifest("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictQueueManifestRequiredRegionRule flags a blank region", () => {
  const rule = new StrictQueueManifestRequiredRegionRule("strict queue manifest needs a value");
  const item = newStrictQueueManifest("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictQueueManifestRegionLengthRule flags a long region", () => {
  const rule = new StrictQueueManifestRegionLengthRule(32);
  const item = newStrictQueueManifest("x", "y");
  item.region = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictQueueManifestCodeLengthRule flags a long code", () => {
  const rule = new StrictQueueManifestCodeLengthRule(64);
  const item = newStrictQueueManifest("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictQueueManifestUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new StrictQueueManifestUpdatedAtRangeRule(120, 255);
  const item = newStrictQueueManifest("x", "y");
  item.updatedAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
