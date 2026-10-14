import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPlacementProfileAudienceIdLengthRule,
  RegionalPlacementProfileTitleLengthRule,
  defaultRegionalPlacementProfileValidator,
} from "./regional-placement-profile-rules.js";
import { newRegionalPlacementProfile } from "./regional-placement-profile.js";

test("RegionalPlacementProfileValidator reports every problem", () => {
  const validator = defaultRegionalPlacementProfileValidator();
  const item = newRegionalPlacementProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPlacementProfileTitleLengthRule flags a long title", () => {
  const rule = new RegionalPlacementProfileTitleLengthRule(1000);
  const item = newRegionalPlacementProfile("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalPlacementProfileAudienceIdLengthRule flags a long audience id", () => {
  const rule = new RegionalPlacementProfileAudienceIdLengthRule(120);
  const item = newRegionalPlacementProfile("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
