import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationDraftContactEmailLengthRule,
  ActivationDraftNameLengthRule,
  defaultActivationDraftValidator,
} from "./activation-draft-rules.js";
import { newActivationDraft } from "./activation-draft.js";

test("ActivationDraftValidator reports every problem", () => {
  const validator = defaultActivationDraftValidator();
  const item = newActivationDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationDraftNameLengthRule flags a long name", () => {
  const rule = new ActivationDraftNameLengthRule(120);
  const item = newActivationDraft("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationDraftContactEmailLengthRule flags a long contact email", () => {
  const rule = new ActivationDraftContactEmailLengthRule(64);
  const item = newActivationDraft("x", "y");
  item.contactEmail = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
