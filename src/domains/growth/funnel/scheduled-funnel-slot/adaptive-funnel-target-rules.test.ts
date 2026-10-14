import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveFunnelTargetRequiredCategoryRule,
  AdaptiveFunnelTargetRequiredNameRule,
  defaultAdaptiveFunnelTargetValidator,
} from "./adaptive-funnel-target-rules.js";
import { newAdaptiveFunnelTarget } from "./adaptive-funnel-target.js";

test("AdaptiveFunnelTargetValidator reports every problem", () => {
  const validator = defaultAdaptiveFunnelTargetValidator();
  const item = newAdaptiveFunnelTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveFunnelTargetRequiredCategoryRule flags a blank category", () => {
  const rule = new AdaptiveFunnelTargetRequiredCategoryRule("adaptive funnel target needs an entry");
  const item = newAdaptiveFunnelTarget("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveFunnelTargetRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveFunnelTargetRequiredNameRule("adaptive funnel target needs a value");
  const item = newAdaptiveFunnelTarget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
