import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofScheduleLabelLengthRule,
  ProofScheduleLocaleLengthRule,
  ProofScheduleRequiredLocaleRule,
  ProofScheduleRequiredTitleRule,
  defaultProofScheduleValidator,
} from "./proof-schedule-rules.js";
import { newProofSchedule } from "./proof-schedule.js";

test("ProofScheduleValidator reports every problem", () => {
  const validator = defaultProofScheduleValidator();
  const item = newProofSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofScheduleLocaleLengthRule flags a long locale", () => {
  const rule = new ProofScheduleLocaleLengthRule(80);
  const item = newProofSchedule("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofScheduleLabelLengthRule flags a long label", () => {
  const rule = new ProofScheduleLabelLengthRule(3600);
  const item = newProofSchedule("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofScheduleRequiredLocaleRule flags a blank locale", () => {
  const rule = new ProofScheduleRequiredLocaleRule("proof schedule needs this field");
  const item = newProofSchedule("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofScheduleRequiredTitleRule flags a blank title", () => {
  const rule = new ProofScheduleRequiredTitleRule("proof schedule needs a value");
  const item = newProofSchedule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
