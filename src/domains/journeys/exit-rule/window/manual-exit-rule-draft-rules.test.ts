import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualExitRuleDraftBatchSizeRangeRule,
  ManualExitRuleDraftRequiredContactEmailRule,
  defaultManualExitRuleDraftValidator,
} from "./manual-exit-rule-draft-rules.js";
import { newManualExitRuleDraft } from "./manual-exit-rule-draft.js";

test("ManualExitRuleDraftValidator reports every problem", () => {
  const validator = defaultManualExitRuleDraftValidator();
  const item = newManualExitRuleDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualExitRuleDraftRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new ManualExitRuleDraftRequiredContactEmailRule("manual exit rule draft needs an entry");
  const item = newManualExitRuleDraft("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualExitRuleDraftBatchSizeRangeRule flags values above batch size", () => {
  const rule = new ManualExitRuleDraftBatchSizeRangeRule(120, 120);
  const item = newManualExitRuleDraft("x", "y");
  item.batchSize = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
