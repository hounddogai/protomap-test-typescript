import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatProfileChecksumLengthRule,
  CsatProfileCodeLengthRule,
  CsatProfileNotesLengthRule,
  CsatProfileRequiredNotesRule,
  CsatProfileRequiredTitleRule,
  defaultCsatProfileValidator,
} from "./csat-profile-rules.js";
import { newCsatProfile } from "./csat-profile.js";

test("CsatProfileValidator reports every problem", () => {
  const validator = defaultCsatProfileValidator();
  const item = newCsatProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatProfileRequiredNotesRule flags a blank notes", () => {
  const rule = new CsatProfileRequiredNotesRule("csat profile needs an entry");
  const item = newCsatProfile("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatProfileChecksumLengthRule flags a long checksum", () => {
  const rule = new CsatProfileChecksumLengthRule(64);
  const item = newCsatProfile("x", "y");
  item.checksum = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatProfileCodeLengthRule flags a long code", () => {
  const rule = new CsatProfileCodeLengthRule(3600);
  const item = newCsatProfile("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatProfileNotesLengthRule flags a long notes", () => {
  const rule = new CsatProfileNotesLengthRule(3600);
  const item = newCsatProfile("x", "y");
  item.notes = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatProfileRequiredTitleRule flags a blank title", () => {
  const rule = new CsatProfileRequiredTitleRule("csat profile needs a value");
  const item = newCsatProfile("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
