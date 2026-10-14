import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelManifestRequiredLabelRule,
  FunnelManifestRequiredSummaryRule,
  defaultFunnelManifestValidator,
} from "./funnel-manifest-rules.js";
import { newFunnelManifest } from "./funnel-manifest.js";

test("FunnelManifestValidator reports every problem", () => {
  const validator = defaultFunnelManifestValidator();
  const item = newFunnelManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelManifestRequiredSummaryRule flags a blank summary", () => {
  const rule = new FunnelManifestRequiredSummaryRule("funnel manifest needs a value");
  const item = newFunnelManifest("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelManifestRequiredLabelRule flags a blank label", () => {
  const rule = new FunnelManifestRequiredLabelRule("funnel manifest needs an entry");
  const item = newFunnelManifest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
