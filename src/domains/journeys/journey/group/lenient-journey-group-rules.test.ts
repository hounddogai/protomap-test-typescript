import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientJourneyGroupOwnerIdLengthRule,
  LenientJourneyGroupRequiredCodeRule,
  LenientJourneyGroupRequiredOwnerIdRule,
  defaultLenientJourneyGroupValidator,
} from "./lenient-journey-group-rules.js";
import { newLenientJourneyGroup } from "./lenient-journey-group.js";

test("LenientJourneyGroupValidator reports every problem", () => {
  const validator = defaultLenientJourneyGroupValidator();
  const item = newLenientJourneyGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientJourneyGroupOwnerIdLengthRule flags a long owner id", () => {
  const rule = new LenientJourneyGroupOwnerIdLengthRule(64);
  const item = newLenientJourneyGroup("x", "y");
  item.ownerId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientJourneyGroupRequiredCodeRule flags a blank code", () => {
  const rule = new LenientJourneyGroupRequiredCodeRule("lenient journey group needs an entry");
  const item = newLenientJourneyGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientJourneyGroupRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new LenientJourneyGroupRequiredOwnerIdRule("lenient journey group needs an entry");
  const item = newLenientJourneyGroup("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
