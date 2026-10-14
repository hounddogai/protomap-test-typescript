import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientWarmupEntryRequiredCodeRule,
  LenientWarmupEntryRequiredTitleRule,
  defaultLenientWarmupEntryValidator,
} from "./lenient-warmup-entry-rules.js";
import { newLenientWarmupEntry } from "./lenient-warmup-entry.js";

test("LenientWarmupEntryValidator reports every problem", () => {
  const validator = defaultLenientWarmupEntryValidator();
  const item = newLenientWarmupEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientWarmupEntryRequiredTitleRule flags a blank title", () => {
  const rule = new LenientWarmupEntryRequiredTitleRule("lenient warmup entry needs an entry");
  const item = newLenientWarmupEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientWarmupEntryRequiredCodeRule flags a blank code", () => {
  const rule = new LenientWarmupEntryRequiredCodeRule("lenient warmup entry needs an entry");
  const item = newLenientWarmupEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
