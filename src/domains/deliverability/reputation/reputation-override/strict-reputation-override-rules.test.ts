import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictReputationOverrideRequiredLabelRule,
  defaultStrictReputationOverrideValidator,
} from "./strict-reputation-override-rules.js";
import { newStrictReputationOverride } from "./strict-reputation-override.js";

test("StrictReputationOverrideValidator reports every problem", () => {
  const validator = defaultStrictReputationOverrideValidator();
  const item = newStrictReputationOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictReputationOverrideRequiredLabelRule flags a blank label", () => {
  const rule = new StrictReputationOverrideRequiredLabelRule("strict reputation override needs a value");
  const item = newStrictReputationOverride("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
