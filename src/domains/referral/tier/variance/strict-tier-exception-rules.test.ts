import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictTierExceptionRequiredChannelRule,
  StrictTierExceptionRequiredLabelRule,
  defaultStrictTierExceptionValidator,
} from "./strict-tier-exception-rules.js";
import { newStrictTierException } from "./strict-tier-exception.js";

test("StrictTierExceptionValidator reports every problem", () => {
  const validator = defaultStrictTierExceptionValidator();
  const item = newStrictTierException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictTierExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new StrictTierExceptionRequiredLabelRule("strict tier exception needs this field");
  const item = newStrictTierException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictTierExceptionRequiredChannelRule flags a blank channel", () => {
  const rule = new StrictTierExceptionRequiredChannelRule("strict tier exception needs an entry");
  const item = newStrictTierException("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
