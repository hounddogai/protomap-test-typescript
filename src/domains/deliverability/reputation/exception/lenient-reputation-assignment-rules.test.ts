import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientReputationAssignmentDurationMinutesRangeRule,
  LenientReputationAssignmentOpenRateRangeRule,
  LenientReputationAssignmentRequiredNameRule,
  LenientReputationAssignmentWeightRangeRule,
  defaultLenientReputationAssignmentValidator,
} from "./lenient-reputation-assignment-rules.js";
import { newLenientReputationAssignment } from "./lenient-reputation-assignment.js";

test("LenientReputationAssignmentValidator reports every problem", () => {
  const validator = defaultLenientReputationAssignmentValidator();
  const item = newLenientReputationAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientReputationAssignmentWeightRangeRule flags values above weight", () => {
  const rule = new LenientReputationAssignmentWeightRangeRule(1.7, 3142.7);
  const item = newLenientReputationAssignment("x", "y");
  item.weight = 3144.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientReputationAssignmentOpenRateRangeRule flags values above open rate", () => {
  const rule = new LenientReputationAssignmentOpenRateRangeRule(8.7, 2166.9);
  const item = newLenientReputationAssignment("x", "y");
  item.openRate = 2168.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientReputationAssignmentRequiredNameRule flags a blank name", () => {
  const rule = new LenientReputationAssignmentRequiredNameRule("lenient reputation assignment needs an entry");
  const item = newLenientReputationAssignment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientReputationAssignmentDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new LenientReputationAssignmentDurationMinutesRangeRule(32, 1000);
  const item = newLenientReputationAssignment("x", "y");
  item.durationMinutes = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
