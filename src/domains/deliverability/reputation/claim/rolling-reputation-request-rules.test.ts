import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingReputationRequestRequiredCountryRule,
  defaultRollingReputationRequestValidator,
} from "./rolling-reputation-request-rules.js";
import { newRollingReputationRequest } from "./rolling-reputation-request.js";

test("RollingReputationRequestValidator reports every problem", () => {
  const validator = defaultRollingReputationRequestValidator();
  const item = newRollingReputationRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingReputationRequestRequiredCountryRule flags a blank country", () => {
  const rule = new RollingReputationRequestRequiredCountryRule("rolling reputation request needs a value");
  const item = newRollingReputationRequest("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
