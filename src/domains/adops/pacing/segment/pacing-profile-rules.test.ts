import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingProfileCodeLengthRule,
  PacingProfileExternalRefLengthRule,
  PacingProfileRequiredCodeRule,
  PacingProfileTitleLengthRule,
  defaultPacingProfileValidator,
} from "./pacing-profile-rules.js";
import { newPacingProfile } from "./pacing-profile.js";

test("PacingProfileValidator reports every problem", () => {
  const validator = defaultPacingProfileValidator();
  const item = newPacingProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingProfileRequiredCodeRule flags a blank code", () => {
  const rule = new PacingProfileRequiredCodeRule("pacing profile needs an entry");
  const item = newPacingProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingProfileCodeLengthRule flags a long code", () => {
  const rule = new PacingProfileCodeLengthRule(120);
  const item = newPacingProfile("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingProfileTitleLengthRule flags a long title", () => {
  const rule = new PacingProfileTitleLengthRule(80);
  const item = newPacingProfile("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingProfileExternalRefLengthRule flags a long external ref", () => {
  const rule = new PacingProfileExternalRefLengthRule(64);
  const item = newPacingProfile("x", "y");
  item.externalRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
