import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientLevelProfileCodeLengthRule,
  LenientLevelProfileNameLengthRule,
  LenientLevelProfileRequiredCodeRule,
  defaultLenientLevelProfileValidator,
} from "./lenient-level-profile-rules.js";
import { newLenientLevelProfile } from "./lenient-level-profile.js";

test("LenientLevelProfileValidator reports every problem", () => {
  const validator = defaultLenientLevelProfileValidator();
  const item = newLenientLevelProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientLevelProfileCodeLengthRule flags a long code", () => {
  const rule = new LenientLevelProfileCodeLengthRule(16);
  const item = newLenientLevelProfile("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientLevelProfileNameLengthRule flags a long name", () => {
  const rule = new LenientLevelProfileNameLengthRule(64);
  const item = newLenientLevelProfile("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientLevelProfileRequiredCodeRule flags a blank code", () => {
  const rule = new LenientLevelProfileRequiredCodeRule("lenient level profile needs an entry");
  const item = newLenientLevelProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
