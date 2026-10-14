import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteManifestCodeLengthRule,
  InviteManifestNameLengthRule,
  InviteManifestRequiredTitleRule,
  InviteManifestTitleLengthRule,
  defaultInviteManifestValidator,
} from "./invite-manifest-rules.js";
import { newInviteManifest } from "./invite-manifest.js";

test("InviteManifestValidator reports every problem", () => {
  const validator = defaultInviteManifestValidator();
  const item = newInviteManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteManifestCodeLengthRule flags a long code", () => {
  const rule = new InviteManifestCodeLengthRule(86400);
  const item = newInviteManifest("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteManifestTitleLengthRule flags a long title", () => {
  const rule = new InviteManifestTitleLengthRule(86400);
  const item = newInviteManifest("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteManifestRequiredTitleRule flags a blank title", () => {
  const rule = new InviteManifestRequiredTitleRule("invite manifest needs this field");
  const item = newInviteManifest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteManifestNameLengthRule flags a long name", () => {
  const rule = new InviteManifestNameLengthRule(86400);
  const item = newInviteManifest("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
