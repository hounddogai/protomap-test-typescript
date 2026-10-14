import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalRewardEntryAudienceIdLengthRule,
  SeasonalRewardEntryQuantityRangeRule,
  SeasonalRewardEntryRequiredAudienceIdRule,
  defaultSeasonalRewardEntryValidator,
} from "./seasonal-reward-entry-rules.js";
import { newSeasonalRewardEntry } from "./seasonal-reward-entry.js";

test("SeasonalRewardEntryValidator reports every problem", () => {
  const validator = defaultSeasonalRewardEntryValidator();
  const item = newSeasonalRewardEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalRewardEntryQuantityRangeRule flags values above quantity", () => {
  const rule = new SeasonalRewardEntryQuantityRangeRule(64, 255);
  const item = newSeasonalRewardEntry("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalRewardEntryAudienceIdLengthRule flags a long audience id", () => {
  const rule = new SeasonalRewardEntryAudienceIdLengthRule(86400);
  const item = newSeasonalRewardEntry("x", "y");
  item.audienceId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalRewardEntryRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new SeasonalRewardEntryRequiredAudienceIdRule("seasonal reward entry needs an entry");
  const item = newSeasonalRewardEntry("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
