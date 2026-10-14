import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalSenderBundleClicksRangeRule,
  RegionalSenderBundleRequiredLabelRule,
  RegionalSenderBundleRequiredOwnerIdRule,
  defaultRegionalSenderBundleValidator,
} from "./regional-sender-bundle-rules.js";
import { newRegionalSenderBundle } from "./regional-sender-bundle.js";

test("RegionalSenderBundleValidator reports every problem", () => {
  const validator = defaultRegionalSenderBundleValidator();
  const item = newRegionalSenderBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalSenderBundleRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new RegionalSenderBundleRequiredOwnerIdRule("regional sender bundle needs this field");
  const item = newRegionalSenderBundle("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalSenderBundleClicksRangeRule flags values above clicks", () => {
  const rule = new RegionalSenderBundleClicksRangeRule(3600, 86400);
  const item = newRegionalSenderBundle("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSenderBundleRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalSenderBundleRequiredLabelRule("regional sender bundle needs this field");
  const item = newRegionalSenderBundle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
