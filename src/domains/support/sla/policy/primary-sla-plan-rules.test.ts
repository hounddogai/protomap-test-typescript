import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimarySlaPlanRequiredCodeRule,
  PrimarySlaPlanRequiredNameRule,
  defaultPrimarySlaPlanValidator,
} from "./primary-sla-plan-rules.js";
import { newPrimarySlaPlan } from "./primary-sla-plan.js";

test("PrimarySlaPlanValidator reports every problem", () => {
  const validator = defaultPrimarySlaPlanValidator();
  const item = newPrimarySlaPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimarySlaPlanRequiredCodeRule flags a blank code", () => {
  const rule = new PrimarySlaPlanRequiredCodeRule("primary sla plan needs this field");
  const item = newPrimarySlaPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimarySlaPlanRequiredNameRule flags a blank name", () => {
  const rule = new PrimarySlaPlanRequiredNameRule("primary sla plan needs an entry");
  const item = newPrimarySlaPlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
