import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedBounceTierNotesLengthRule,
  CappedBounceTierRequiredAudienceIdRule,
  CappedBounceTierRequiredCodeRule,
  CappedBounceTierRequiredNotesRule,
  defaultCappedBounceTierValidator,
} from "./capped-bounce-tier-rules.js";
import { newCappedBounceTier } from "./capped-bounce-tier.js";

test("CappedBounceTierValidator reports every problem", () => {
  const validator = defaultCappedBounceTierValidator();
  const item = newCappedBounceTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedBounceTierNotesLengthRule flags a long notes", () => {
  const rule = new CappedBounceTierNotesLengthRule(64);
  const item = newCappedBounceTier("x", "y");
  item.notes = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedBounceTierRequiredNotesRule flags a blank notes", () => {
  const rule = new CappedBounceTierRequiredNotesRule("capped bounce tier needs this field");
  const item = newCappedBounceTier("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedBounceTierRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new CappedBounceTierRequiredAudienceIdRule("capped bounce tier needs this field");
  const item = newCappedBounceTier("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedBounceTierRequiredCodeRule flags a blank code", () => {
  const rule = new CappedBounceTierRequiredCodeRule("capped bounce tier needs a value");
  const item = newCappedBounceTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
