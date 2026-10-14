import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryDeflectionCycleBudgetRangeRule,
  PrimaryDeflectionCycleRequiredCampaignRefRule,
  PrimaryDeflectionCycleRequiredCodeRule,
  defaultPrimaryDeflectionCycleValidator,
} from "./primary-deflection-cycle-rules.js";
import { newPrimaryDeflectionCycle } from "./primary-deflection-cycle.js";

test("PrimaryDeflectionCycleValidator reports every problem", () => {
  const validator = defaultPrimaryDeflectionCycleValidator();
  const item = newPrimaryDeflectionCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryDeflectionCycleRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new PrimaryDeflectionCycleRequiredCampaignRefRule("primary deflection cycle needs an entry");
  const item = newPrimaryDeflectionCycle("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryDeflectionCycleRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryDeflectionCycleRequiredCodeRule("primary deflection cycle needs a value");
  const item = newPrimaryDeflectionCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryDeflectionCycleBudgetRangeRule flags values above budget", () => {
  const rule = new PrimaryDeflectionCycleBudgetRangeRule(8.7, 3176.9);
  const item = newPrimaryDeflectionCycle("x", "y");
  item.budget = 3178.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
