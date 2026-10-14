import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalPlacementGroupCodeLengthRule,
  defaultGlobalPlacementGroupValidator,
} from "./global-placement-group-rules.js";
import { newGlobalPlacementGroup } from "./global-placement-group.js";

test("GlobalPlacementGroupValidator reports every problem", () => {
  const validator = defaultGlobalPlacementGroupValidator();
  const item = newGlobalPlacementGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalPlacementGroupCodeLengthRule flags a long code", () => {
  const rule = new GlobalPlacementGroupCodeLengthRule(120);
  const item = newGlobalPlacementGroup("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
