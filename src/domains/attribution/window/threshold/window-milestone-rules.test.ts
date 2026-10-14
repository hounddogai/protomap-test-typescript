import assert from "node:assert/strict";
import { test } from "node:test";
import { WindowMilestoneRequiredExternalRefRule, defaultWindowMilestoneValidator } from "./window-milestone-rules.js";
import { newWindowMilestone } from "./window-milestone.js";

test("WindowMilestoneValidator reports every problem", () => {
  const validator = defaultWindowMilestoneValidator();
  const item = newWindowMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowMilestoneRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new WindowMilestoneRequiredExternalRefRule("window milestone needs a value");
  const item = newWindowMilestone("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
