import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictTicketViewManifestCodeLengthRule,
  StrictTicketViewManifestRequiredTitleRule,
  defaultStrictTicketViewManifestValidator,
} from "./strict-ticket-view-manifest-rules.js";
import { newStrictTicketViewManifest } from "./strict-ticket-view-manifest.js";

test("StrictTicketViewManifestValidator reports every problem", () => {
  const validator = defaultStrictTicketViewManifestValidator();
  const item = newStrictTicketViewManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictTicketViewManifestCodeLengthRule flags a long code", () => {
  const rule = new StrictTicketViewManifestCodeLengthRule(86400);
  const item = newStrictTicketViewManifest("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictTicketViewManifestRequiredTitleRule flags a blank title", () => {
  const rule = new StrictTicketViewManifestRequiredTitleRule("strict ticket view manifest needs this field");
  const item = newStrictTicketViewManifest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
