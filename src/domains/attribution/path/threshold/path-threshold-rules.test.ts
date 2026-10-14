import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathThresholdRequiredAudienceIdRule,
  PathThresholdRequiredCodeRule,
  PathThresholdRequiredNameRule,
  defaultPathThresholdValidator,
} from "./path-threshold-rules.js";
import { newPathThreshold } from "./path-threshold.js";

test("PathThresholdValidator reports every problem", () => {
  const validator = defaultPathThresholdValidator();
  const item = newPathThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathThresholdRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new PathThresholdRequiredAudienceIdRule("path threshold needs this field");
  const item = newPathThreshold("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathThresholdRequiredNameRule flags a blank name", () => {
  const rule = new PathThresholdRequiredNameRule("path threshold needs a value");
  const item = newPathThreshold("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new PathThresholdRequiredCodeRule("path threshold needs an entry");
  const item = newPathThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
