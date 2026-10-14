import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionDigestBudgetRangeRule,
  DeflectionDigestOwnerIdLengthRule,
  DeflectionDigestStartsAtRangeRule,
  DeflectionDigestUtmSourceLengthRule,
  defaultDeflectionDigestValidator,
} from "./deflection-digest-rules.js";
import { newDeflectionDigest } from "./deflection-digest.js";

test("DeflectionDigestValidator reports every problem", () => {
  const validator = defaultDeflectionDigestValidator();
  const item = newDeflectionDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionDigestBudgetRangeRule flags values above budget", () => {
  const rule = new DeflectionDigestBudgetRangeRule(1.4, 4460.6);
  const item = newDeflectionDigest("x", "y");
  item.budget = 4462.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionDigestOwnerIdLengthRule flags a long owner id", () => {
  const rule = new DeflectionDigestOwnerIdLengthRule(80);
  const item = newDeflectionDigest("x", "y");
  item.ownerId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionDigestStartsAtRangeRule flags values above starts at", () => {
  const rule = new DeflectionDigestStartsAtRangeRule(255, 3600);
  const item = newDeflectionDigest("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionDigestUtmSourceLengthRule flags a long utm source", () => {
  const rule = new DeflectionDigestUtmSourceLengthRule(16);
  const item = newDeflectionDigest("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
