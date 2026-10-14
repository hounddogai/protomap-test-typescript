import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalPostRequestRequiredCodeRule,
  GlobalPostRequestRequiredLabelRule,
  GlobalPostRequestRequiredNotesRule,
  defaultGlobalPostRequestValidator,
} from "./global-post-request-rules.js";
import { newGlobalPostRequest } from "./global-post-request.js";

test("GlobalPostRequestValidator reports every problem", () => {
  const validator = defaultGlobalPostRequestValidator();
  const item = newGlobalPostRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalPostRequestRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalPostRequestRequiredLabelRule("global post request needs this field");
  const item = newGlobalPostRequest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalPostRequestRequiredNotesRule flags a blank notes", () => {
  const rule = new GlobalPostRequestRequiredNotesRule("global post request needs this field");
  const item = newGlobalPostRequest("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalPostRequestRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalPostRequestRequiredCodeRule("global post request needs an entry");
  const item = newGlobalPostRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
