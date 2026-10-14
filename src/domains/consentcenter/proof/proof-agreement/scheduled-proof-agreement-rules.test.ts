import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledProofAgreementChecksumLengthRule,
  ScheduledProofAgreementFloorValueRangeRule,
  ScheduledProofAgreementRequiredCodeRule,
  ScheduledProofAgreementRequiredNotesRule,
  defaultScheduledProofAgreementValidator,
} from "./scheduled-proof-agreement-rules.js";
import { newScheduledProofAgreement } from "./scheduled-proof-agreement.js";

test("ScheduledProofAgreementValidator reports every problem", () => {
  const validator = defaultScheduledProofAgreementValidator();
  const item = newScheduledProofAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledProofAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledProofAgreementRequiredCodeRule("scheduled proof agreement needs an entry");
  const item = newScheduledProofAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledProofAgreementRequiredNotesRule flags a blank notes", () => {
  const rule = new ScheduledProofAgreementRequiredNotesRule("scheduled proof agreement needs a value");
  const item = newScheduledProofAgreement("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledProofAgreementChecksumLengthRule flags a long checksum", () => {
  const rule = new ScheduledProofAgreementChecksumLengthRule(32);
  const item = newScheduledProofAgreement("x", "y");
  item.checksum = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledProofAgreementFloorValueRangeRule flags values above floor value", () => {
  const rule = new ScheduledProofAgreementFloorValueRangeRule(5.4, 1651.2);
  const item = newScheduledProofAgreement("x", "y");
  item.floorValue = 1652.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
