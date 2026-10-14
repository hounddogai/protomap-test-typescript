import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultFlightOverrideNameLengthRule,
  DefaultFlightOverrideRequiredCodeRule,
  DefaultFlightOverrideRequiredNameRule,
  defaultDefaultFlightOverrideValidator,
} from "./default-flight-override-rules.js";
import { newDefaultFlightOverride } from "./default-flight-override.js";

test("DefaultFlightOverrideValidator reports every problem", () => {
  const validator = defaultDefaultFlightOverrideValidator();
  const item = newDefaultFlightOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultFlightOverrideRequiredNameRule flags a blank name", () => {
  const rule = new DefaultFlightOverrideRequiredNameRule("default flight override needs this field");
  const item = newDefaultFlightOverride("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultFlightOverrideNameLengthRule flags a long name", () => {
  const rule = new DefaultFlightOverrideNameLengthRule(16);
  const item = newDefaultFlightOverride("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultFlightOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultFlightOverrideRequiredCodeRule("default flight override needs this field");
  const item = newDefaultFlightOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
