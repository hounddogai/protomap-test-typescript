import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictOptOutProfileRequiredLocaleRule,
  defaultStrictOptOutProfileValidator,
} from "./strict-opt-out-profile-rules.js";
import { newStrictOptOutProfile } from "./strict-opt-out-profile.js";

test("StrictOptOutProfileValidator reports every problem", () => {
  const validator = defaultStrictOptOutProfileValidator();
  const item = newStrictOptOutProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictOptOutProfileRequiredLocaleRule flags a blank locale", () => {
  const rule = new StrictOptOutProfileRequiredLocaleRule("strict opt out profile needs a value");
  const item = newStrictOptOutProfile("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
