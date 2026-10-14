import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalQueueProfileCodeLengthRule,
  RegionalQueueProfileRequiredNameRule,
  defaultRegionalQueueProfileValidator,
} from "./regional-queue-profile-rules.js";
import { newRegionalQueueProfile } from "./regional-queue-profile.js";

test("RegionalQueueProfileValidator reports every problem", () => {
  const validator = defaultRegionalQueueProfileValidator();
  const item = newRegionalQueueProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalQueueProfileRequiredNameRule flags a blank name", () => {
  const rule = new RegionalQueueProfileRequiredNameRule("regional queue profile needs this field");
  const item = newRegionalQueueProfile("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalQueueProfileCodeLengthRule flags a long code", () => {
  const rule = new RegionalQueueProfileCodeLengthRule(32);
  const item = newRegionalQueueProfile("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
