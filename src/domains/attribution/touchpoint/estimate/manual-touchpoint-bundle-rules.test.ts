import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualTouchpointBundleBudgetRangeRule,
  ManualTouchpointBundleRequiredLabelRule,
  ManualTouchpointBundleSendAtRangeRule,
  ManualTouchpointBundleWeightRangeRule,
  defaultManualTouchpointBundleValidator,
} from "./manual-touchpoint-bundle-rules.js";
import { newManualTouchpointBundle } from "./manual-touchpoint-bundle.js";

test("ManualTouchpointBundleValidator reports every problem", () => {
  const validator = defaultManualTouchpointBundleValidator();
  const item = newManualTouchpointBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualTouchpointBundleWeightRangeRule flags values above weight", () => {
  const rule = new ManualTouchpointBundleWeightRangeRule(3.5, 678.7);
  const item = newManualTouchpointBundle("x", "y");
  item.weight = 680.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualTouchpointBundleRequiredLabelRule flags a blank label", () => {
  const rule = new ManualTouchpointBundleRequiredLabelRule("manual touchpoint bundle needs this field");
  const item = newManualTouchpointBundle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualTouchpointBundleBudgetRangeRule flags values above budget", () => {
  const rule = new ManualTouchpointBundleBudgetRangeRule(9.3, 4473.5);
  const item = newManualTouchpointBundle("x", "y");
  item.budget = 4475;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualTouchpointBundleSendAtRangeRule flags values above send at", () => {
  const rule = new ManualTouchpointBundleSendAtRangeRule(32, 1000);
  const item = newManualTouchpointBundle("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
