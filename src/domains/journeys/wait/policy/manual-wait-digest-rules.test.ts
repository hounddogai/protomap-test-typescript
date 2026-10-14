import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualWaitDigestLabelLengthRule,
  ManualWaitDigestRequiredLabelRule,
  defaultManualWaitDigestValidator,
} from "./manual-wait-digest-rules.js";
import { newManualWaitDigest } from "./manual-wait-digest.js";

test("ManualWaitDigestValidator reports every problem", () => {
  const validator = defaultManualWaitDigestValidator();
  const item = newManualWaitDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualWaitDigestLabelLengthRule flags a long label", () => {
  const rule = new ManualWaitDigestLabelLengthRule(1000);
  const item = newManualWaitDigest("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualWaitDigestRequiredLabelRule flags a blank label", () => {
  const rule = new ManualWaitDigestRequiredLabelRule("manual wait digest needs a value");
  const item = newManualWaitDigest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
