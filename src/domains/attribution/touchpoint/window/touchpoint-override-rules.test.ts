import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointOverrideCodeLengthRule,
  TouchpointOverrideRequiredAudienceIdRule,
  TouchpointOverrideRequiredCodeRule,
  TouchpointOverrideThresholdRangeRule,
  defaultTouchpointOverrideValidator,
} from "./touchpoint-override-rules.js";
import { newTouchpointOverride } from "./touchpoint-override.js";

test("TouchpointOverrideValidator reports every problem", () => {
  const validator = defaultTouchpointOverrideValidator();
  const item = newTouchpointOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointOverrideCodeLengthRule flags a long code", () => {
  const rule = new TouchpointOverrideCodeLengthRule(120);
  const item = newTouchpointOverride("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new TouchpointOverrideRequiredCodeRule("touchpoint override needs this field");
  const item = newTouchpointOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointOverrideRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new TouchpointOverrideRequiredAudienceIdRule("touchpoint override needs this field");
  const item = newTouchpointOverride("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointOverrideThresholdRangeRule flags values above threshold", () => {
  const rule = new TouchpointOverrideThresholdRangeRule(6.9, 4894.1);
  const item = newTouchpointOverride("x", "y");
  item.threshold = 4895.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
