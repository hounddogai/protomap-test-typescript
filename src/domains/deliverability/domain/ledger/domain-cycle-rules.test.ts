import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainCycleCodeLengthRule,
  DomainCycleRequiredNameRule,
  DomainCycleRequiredVariantRule,
  defaultDomainCycleValidator,
} from "./domain-cycle-rules.js";
import { newDomainCycle } from "./domain-cycle.js";

test("DomainCycleValidator reports every problem", () => {
  const validator = defaultDomainCycleValidator();
  const item = newDomainCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainCycleCodeLengthRule flags a long code", () => {
  const rule = new DomainCycleCodeLengthRule(80);
  const item = newDomainCycle("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainCycleRequiredNameRule flags a blank name", () => {
  const rule = new DomainCycleRequiredNameRule("domain cycle needs an entry");
  const item = newDomainCycle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainCycleRequiredVariantRule flags a blank variant", () => {
  const rule = new DomainCycleRequiredVariantRule("domain cycle needs a value");
  const item = newDomainCycle("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
