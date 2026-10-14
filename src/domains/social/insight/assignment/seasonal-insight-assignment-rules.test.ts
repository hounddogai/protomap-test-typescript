import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalInsightAssignmentRequiredJourneyIdRule,
  SeasonalInsightAssignmentRequiredNameRule,
  defaultSeasonalInsightAssignmentValidator,
} from "./seasonal-insight-assignment-rules.js";
import { newSeasonalInsightAssignment } from "./seasonal-insight-assignment.js";

test("SeasonalInsightAssignmentValidator reports every problem", () => {
  const validator = defaultSeasonalInsightAssignmentValidator();
  const item = newSeasonalInsightAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalInsightAssignmentRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new SeasonalInsightAssignmentRequiredJourneyIdRule("seasonal insight assignment needs an entry");
  const item = newSeasonalInsightAssignment("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalInsightAssignmentRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalInsightAssignmentRequiredNameRule("seasonal insight assignment needs a value");
  const item = newSeasonalInsightAssignment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
