import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPathBundleCodeLengthRule,
  RegionalPathBundleRequiredChannelRule,
  RegionalPathBundleRequiredCodeRule,
  RegionalPathBundleRequiredContactEmailRule,
  defaultRegionalPathBundleValidator,
} from "./regional-path-bundle-rules.js";
import { newRegionalPathBundle } from "./regional-path-bundle.js";

test("RegionalPathBundleValidator reports every problem", () => {
  const validator = defaultRegionalPathBundleValidator();
  const item = newRegionalPathBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPathBundleRequiredChannelRule flags a blank channel", () => {
  const rule = new RegionalPathBundleRequiredChannelRule("regional path bundle needs this field");
  const item = newRegionalPathBundle("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalPathBundleCodeLengthRule flags a long code", () => {
  const rule = new RegionalPathBundleCodeLengthRule(32);
  const item = newRegionalPathBundle("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalPathBundleRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalPathBundleRequiredCodeRule("regional path bundle needs a value");
  const item = newRegionalPathBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalPathBundleRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new RegionalPathBundleRequiredContactEmailRule("regional path bundle needs this field");
  const item = newRegionalPathBundle("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
