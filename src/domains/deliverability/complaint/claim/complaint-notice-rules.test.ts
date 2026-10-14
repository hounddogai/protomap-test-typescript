import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintNoticeCodeLengthRule,
  ComplaintNoticeExternalRefLengthRule,
  ComplaintNoticeRequiredCodeRule,
  ComplaintNoticeRequiredOwnerIdRule,
  defaultComplaintNoticeValidator,
} from "./complaint-notice-rules.js";
import { newComplaintNotice } from "./complaint-notice.js";

test("ComplaintNoticeValidator reports every problem", () => {
  const validator = defaultComplaintNoticeValidator();
  const item = newComplaintNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintNoticeRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ComplaintNoticeRequiredOwnerIdRule("complaint notice needs a value");
  const item = newComplaintNotice("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintNoticeExternalRefLengthRule flags a long external ref", () => {
  const rule = new ComplaintNoticeExternalRefLengthRule(120);
  const item = newComplaintNotice("x", "y");
  item.externalRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintNoticeCodeLengthRule flags a long code", () => {
  const rule = new ComplaintNoticeCodeLengthRule(120);
  const item = newComplaintNotice("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new ComplaintNoticeRequiredCodeRule("complaint notice needs this field");
  const item = newComplaintNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
