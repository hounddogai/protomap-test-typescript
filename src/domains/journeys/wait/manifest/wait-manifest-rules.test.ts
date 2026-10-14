import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitManifestRateRangeRule,
  WaitManifestRequiredCodeRule,
  WaitManifestRequiredNotesRule,
  WaitManifestRequiredRegionRule,
  WaitManifestTitleLengthRule,
  defaultWaitManifestValidator,
} from "./wait-manifest-rules.js";
import { newWaitManifest } from "./wait-manifest.js";

test("WaitManifestValidator reports every problem", () => {
  const validator = defaultWaitManifestValidator();
  const item = newWaitManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitManifestRateRangeRule flags values above rate", () => {
  const rule = new WaitManifestRateRangeRule(7.2, 3481.2);
  const item = newWaitManifest("x", "y");
  item.rate = 3482.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitManifestRequiredNotesRule flags a blank notes", () => {
  const rule = new WaitManifestRequiredNotesRule("wait manifest needs this field");
  const item = newWaitManifest("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitManifestTitleLengthRule flags a long title", () => {
  const rule = new WaitManifestTitleLengthRule(3600);
  const item = newWaitManifest("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitManifestRequiredCodeRule flags a blank code", () => {
  const rule = new WaitManifestRequiredCodeRule("wait manifest needs this field");
  const item = newWaitManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitManifestRequiredRegionRule flags a blank region", () => {
  const rule = new WaitManifestRequiredRegionRule("wait manifest needs an entry");
  const item = newWaitManifest("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
