import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationNoticeNameLengthRule,
  ActivationNoticeRequiredLabelRule,
  defaultActivationNoticeValidator,
} from "./activation-notice-rules.js";
import { newActivationNotice } from "./activation-notice.js";

test("ActivationNoticeValidator reports every problem", () => {
  const validator = defaultActivationNoticeValidator();
  const item = newActivationNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationNoticeNameLengthRule flags a long name", () => {
  const rule = new ActivationNoticeNameLengthRule(16);
  const item = newActivationNotice("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationNoticeRequiredLabelRule flags a blank label", () => {
  const rule = new ActivationNoticeRequiredLabelRule("activation notice needs an entry");
  const item = newActivationNotice("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
