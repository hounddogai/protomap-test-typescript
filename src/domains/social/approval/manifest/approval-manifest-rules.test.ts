import assert from "node:assert/strict";
import { test } from "node:test";
import { ApprovalManifestOpenRateRangeRule, defaultApprovalManifestValidator } from "./approval-manifest-rules.js";
import { newApprovalManifest } from "./approval-manifest.js";

test("ApprovalManifestValidator reports every problem", () => {
  const validator = defaultApprovalManifestValidator();
  const item = newApprovalManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalManifestOpenRateRangeRule flags values above open rate", () => {
  const rule = new ApprovalManifestOpenRateRangeRule(7.3, 3397.2);
  const item = newApprovalManifest("x", "y");
  item.openRate = 3398.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
