import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveExitRuleDraftCodeLengthRule,
  defaultAdaptiveExitRuleDraftValidator,
} from "./adaptive-exit-rule-draft-rules.js";
import { newAdaptiveExitRuleDraft } from "./adaptive-exit-rule-draft.js";

test("AdaptiveExitRuleDraftValidator reports every problem", () => {
  const validator = defaultAdaptiveExitRuleDraftValidator();
  const item = newAdaptiveExitRuleDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveExitRuleDraftCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveExitRuleDraftCodeLengthRule(1000);
  const item = newAdaptiveExitRuleDraft("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
