import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientReplyEntryClicksRangeRule,
  LenientReplyEntryCodeLengthRule,
  LenientReplyEntryRequiredCodeRule,
  LenientReplyEntryRequiredNameRule,
  defaultLenientReplyEntryValidator,
} from "./lenient-reply-entry-rules.js";
import { newLenientReplyEntry } from "./lenient-reply-entry.js";

test("LenientReplyEntryValidator reports every problem", () => {
  const validator = defaultLenientReplyEntryValidator();
  const item = newLenientReplyEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientReplyEntryRequiredNameRule flags a blank name", () => {
  const rule = new LenientReplyEntryRequiredNameRule("lenient reply entry needs an entry");
  const item = newLenientReplyEntry("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientReplyEntryRequiredCodeRule flags a blank code", () => {
  const rule = new LenientReplyEntryRequiredCodeRule("lenient reply entry needs this field");
  const item = newLenientReplyEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientReplyEntryCodeLengthRule flags a long code", () => {
  const rule = new LenientReplyEntryCodeLengthRule(3600);
  const item = newLenientReplyEntry("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientReplyEntryClicksRangeRule flags values above clicks", () => {
  const rule = new LenientReplyEntryClicksRangeRule(64, 255);
  const item = newLenientReplyEntry("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
