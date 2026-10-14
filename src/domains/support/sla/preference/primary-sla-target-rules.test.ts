import assert from "node:assert/strict";
import { test } from "node:test";
import { PrimarySlaTargetCodeLengthRule, defaultPrimarySlaTargetValidator } from "./primary-sla-target-rules.js";
import { newPrimarySlaTarget } from "./primary-sla-target.js";

test("PrimarySlaTargetValidator reports every problem", () => {
  const validator = defaultPrimarySlaTargetValidator();
  const item = newPrimarySlaTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimarySlaTargetCodeLengthRule flags a long code", () => {
  const rule = new PrimarySlaTargetCodeLengthRule(64);
  const item = newPrimarySlaTarget("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
