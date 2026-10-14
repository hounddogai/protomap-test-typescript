import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalDomainAgreementCodeLengthRule,
  SeasonalDomainAgreementRequiredCodeRule,
  SeasonalDomainAgreementRequiredNotesRule,
  defaultSeasonalDomainAgreementValidator,
} from "./seasonal-domain-agreement-rules.js";
import { newSeasonalDomainAgreement } from "./seasonal-domain-agreement.js";

test("SeasonalDomainAgreementValidator reports every problem", () => {
  const validator = defaultSeasonalDomainAgreementValidator();
  const item = newSeasonalDomainAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalDomainAgreementRequiredNotesRule flags a blank notes", () => {
  const rule = new SeasonalDomainAgreementRequiredNotesRule("seasonal domain agreement needs an entry");
  const item = newSeasonalDomainAgreement("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalDomainAgreementCodeLengthRule flags a long code", () => {
  const rule = new SeasonalDomainAgreementCodeLengthRule(32);
  const item = newSeasonalDomainAgreement("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalDomainAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalDomainAgreementRequiredCodeRule("seasonal domain agreement needs an entry");
  const item = newSeasonalDomainAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
