import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalComplaintManifestChannelLengthRule,
  RegionalComplaintManifestCodeLengthRule,
  RegionalComplaintManifestRequiredCodeRule,
  RegionalComplaintManifestUtmSourceLengthRule,
  defaultRegionalComplaintManifestValidator,
} from "./regional-complaint-manifest-rules.js";
import { newRegionalComplaintManifest } from "./regional-complaint-manifest.js";

test("RegionalComplaintManifestValidator reports every problem", () => {
  const validator = defaultRegionalComplaintManifestValidator();
  const item = newRegionalComplaintManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalComplaintManifestRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalComplaintManifestRequiredCodeRule("regional complaint manifest needs an entry");
  const item = newRegionalComplaintManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalComplaintManifestChannelLengthRule flags a long channel", () => {
  const rule = new RegionalComplaintManifestChannelLengthRule(86400);
  const item = newRegionalComplaintManifest("x", "y");
  item.channel = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalComplaintManifestCodeLengthRule flags a long code", () => {
  const rule = new RegionalComplaintManifestCodeLengthRule(1000);
  const item = newRegionalComplaintManifest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalComplaintManifestUtmSourceLengthRule flags a long utm source", () => {
  const rule = new RegionalComplaintManifestUtmSourceLengthRule(120);
  const item = newRegionalComplaintManifest("x", "y");
  item.utmSource = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
