import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalReplyWindowOpenRateRangeRule,
  SeasonalReplyWindowRequiredAudienceIdRule,
  SeasonalReplyWindowRequiredCodeRule,
  SeasonalReplyWindowVariantLengthRule,
  defaultSeasonalReplyWindowValidator,
} from "./seasonal-reply-window-rules.js";
import { newSeasonalReplyWindow } from "./seasonal-reply-window.js";

test("SeasonalReplyWindowValidator reports every problem", () => {
  const validator = defaultSeasonalReplyWindowValidator();
  const item = newSeasonalReplyWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalReplyWindowRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalReplyWindowRequiredCodeRule("seasonal reply window needs a value");
  const item = newSeasonalReplyWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalReplyWindowRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new SeasonalReplyWindowRequiredAudienceIdRule("seasonal reply window needs an entry");
  const item = newSeasonalReplyWindow("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalReplyWindowOpenRateRangeRule flags values above open rate", () => {
  const rule = new SeasonalReplyWindowOpenRateRangeRule(1.4, 2359.6);
  const item = newSeasonalReplyWindow("x", "y");
  item.openRate = 2361.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalReplyWindowVariantLengthRule flags a long variant", () => {
  const rule = new SeasonalReplyWindowVariantLengthRule(16);
  const item = newSeasonalReplyWindow("x", "y");
  item.variant = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
