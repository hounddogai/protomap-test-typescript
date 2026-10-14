import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelDraftMarginRangeRule,
  ModelDraftRequiredTitleRule,
  ModelDraftRequiredVariantRule,
  defaultModelDraftValidator,
} from "./model-draft-rules.js";
import { newModelDraft } from "./model-draft.js";

test("ModelDraftValidator reports every problem", () => {
  const validator = defaultModelDraftValidator();
  const item = newModelDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelDraftRequiredVariantRule flags a blank variant", () => {
  const rule = new ModelDraftRequiredVariantRule("model draft needs a value");
  const item = newModelDraft("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelDraftMarginRangeRule flags values above margin", () => {
  const rule = new ModelDraftMarginRangeRule(9.2, 675.4);
  const item = newModelDraft("x", "y");
  item.margin = 676.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelDraftRequiredTitleRule flags a blank title", () => {
  const rule = new ModelDraftRequiredTitleRule("model draft needs this field");
  const item = newModelDraft("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
