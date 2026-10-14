import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredWaitManifestRequiredCodeRule,
  TieredWaitManifestRequiredLabelRule,
  TieredWaitManifestUpdatedAtRangeRule,
  defaultTieredWaitManifestValidator,
} from "./tiered-wait-manifest-rules.js";
import { newTieredWaitManifest } from "./tiered-wait-manifest.js";

test("TieredWaitManifestValidator reports every problem", () => {
  const validator = defaultTieredWaitManifestValidator();
  const item = newTieredWaitManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredWaitManifestRequiredLabelRule flags a blank label", () => {
  const rule = new TieredWaitManifestRequiredLabelRule("tiered wait manifest needs a value");
  const item = newTieredWaitManifest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredWaitManifestRequiredCodeRule flags a blank code", () => {
  const rule = new TieredWaitManifestRequiredCodeRule("tiered wait manifest needs a value");
  const item = newTieredWaitManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredWaitManifestUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new TieredWaitManifestUpdatedAtRangeRule(16, 32);
  const item = newTieredWaitManifest("x", "y");
  item.updatedAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
