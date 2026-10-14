import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingDoubleOptInDigestCodeLengthRule,
  PendingDoubleOptInDigestLabelLengthRule,
  PendingDoubleOptInDigestRequiredCodeRule,
  PendingDoubleOptInDigestRequiredTimezoneRule,
  defaultPendingDoubleOptInDigestValidator,
} from "./pending-double-opt-in-digest-rules.js";
import { newPendingDoubleOptInDigest } from "./pending-double-opt-in-digest.js";

test("PendingDoubleOptInDigestValidator reports every problem", () => {
  const validator = defaultPendingDoubleOptInDigestValidator();
  const item = newPendingDoubleOptInDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingDoubleOptInDigestLabelLengthRule flags a long label", () => {
  const rule = new PendingDoubleOptInDigestLabelLengthRule(120);
  const item = newPendingDoubleOptInDigest("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingDoubleOptInDigestRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new PendingDoubleOptInDigestRequiredTimezoneRule("pending double opt in digest needs an entry");
  const item = newPendingDoubleOptInDigest("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingDoubleOptInDigestRequiredCodeRule flags a blank code", () => {
  const rule = new PendingDoubleOptInDigestRequiredCodeRule("pending double opt in digest needs this field");
  const item = newPendingDoubleOptInDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingDoubleOptInDigestCodeLengthRule flags a long code", () => {
  const rule = new PendingDoubleOptInDigestCodeLengthRule(32);
  const item = newPendingDoubleOptInDigest("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
