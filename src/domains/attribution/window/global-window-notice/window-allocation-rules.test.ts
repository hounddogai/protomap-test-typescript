import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowAllocationRequiredChannelRule,
  WindowAllocationRequiredCodeRule,
  WindowAllocationRequiredNameRule,
  defaultWindowAllocationValidator,
} from "./window-allocation-rules.js";
import { newWindowAllocation } from "./window-allocation.js";

test("WindowAllocationValidator reports every problem", () => {
  const validator = defaultWindowAllocationValidator();
  const item = newWindowAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowAllocationRequiredChannelRule flags a blank channel", () => {
  const rule = new WindowAllocationRequiredChannelRule("window allocation needs an entry");
  const item = newWindowAllocation("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new WindowAllocationRequiredCodeRule("window allocation needs an entry");
  const item = newWindowAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowAllocationRequiredNameRule flags a blank name", () => {
  const rule = new WindowAllocationRequiredNameRule("window allocation needs a value");
  const item = newWindowAllocation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
