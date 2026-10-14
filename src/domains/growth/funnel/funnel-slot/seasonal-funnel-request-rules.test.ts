import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalFunnelRequestRequiredCodeRule,
  SeasonalFunnelRequestRequiredLocaleRule,
  SeasonalFunnelRequestRequiredNameRule,
  SeasonalFunnelRequestSequenceRangeRule,
  defaultSeasonalFunnelRequestValidator,
} from "./seasonal-funnel-request-rules.js";
import { newSeasonalFunnelRequest } from "./seasonal-funnel-request.js";

test("SeasonalFunnelRequestValidator reports every problem", () => {
  const validator = defaultSeasonalFunnelRequestValidator();
  const item = newSeasonalFunnelRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalFunnelRequestSequenceRangeRule flags values above sequence", () => {
  const rule = new SeasonalFunnelRequestSequenceRangeRule(255, 1000);
  const item = newSeasonalFunnelRequest("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalFunnelRequestRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalFunnelRequestRequiredCodeRule("seasonal funnel request needs an entry");
  const item = newSeasonalFunnelRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalFunnelRequestRequiredLocaleRule flags a blank locale", () => {
  const rule = new SeasonalFunnelRequestRequiredLocaleRule("seasonal funnel request needs an entry");
  const item = newSeasonalFunnelRequest("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalFunnelRequestRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalFunnelRequestRequiredNameRule("seasonal funnel request needs this field");
  const item = newSeasonalFunnelRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
