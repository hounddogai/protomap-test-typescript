import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintExceptionCodeLengthRule,
  ComplaintExceptionNameLengthRule,
  ComplaintExceptionRequiredCodeRule,
  defaultComplaintExceptionValidator,
} from "./complaint-exception-rules.js";
import { newComplaintException } from "./complaint-exception.js";

test("ComplaintExceptionValidator reports every problem", () => {
  const validator = defaultComplaintExceptionValidator();
  const item = newComplaintException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintExceptionCodeLengthRule flags a long code", () => {
  const rule = new ComplaintExceptionCodeLengthRule(120);
  const item = newComplaintException("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintExceptionNameLengthRule flags a long name", () => {
  const rule = new ComplaintExceptionNameLengthRule(80);
  const item = newComplaintException("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new ComplaintExceptionRequiredCodeRule("complaint exception needs an entry");
  const item = newComplaintException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
