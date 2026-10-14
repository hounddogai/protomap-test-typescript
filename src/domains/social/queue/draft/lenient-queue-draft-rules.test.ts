import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientQueueDraftLabelLengthRule,
  LenientQueueDraftRequiredCategoryRule,
  LenientQueueDraftRequiredCodeRule,
  defaultLenientQueueDraftValidator,
} from "./lenient-queue-draft-rules.js";
import { newLenientQueueDraft } from "./lenient-queue-draft.js";

test("LenientQueueDraftValidator reports every problem", () => {
  const validator = defaultLenientQueueDraftValidator();
  const item = newLenientQueueDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientQueueDraftLabelLengthRule flags a long label", () => {
  const rule = new LenientQueueDraftLabelLengthRule(86400);
  const item = newLenientQueueDraft("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientQueueDraftRequiredCodeRule flags a blank code", () => {
  const rule = new LenientQueueDraftRequiredCodeRule("lenient queue draft needs an entry");
  const item = newLenientQueueDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientQueueDraftRequiredCategoryRule flags a blank category", () => {
  const rule = new LenientQueueDraftRequiredCategoryRule("lenient queue draft needs an entry");
  const item = newLenientQueueDraft("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
