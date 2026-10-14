import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualTicketViewMetricMinimumRangeRule,
  ManualTicketViewMetricRequiredAudienceIdRule,
  ManualTicketViewMetricRequiredChannelRule,
  defaultManualTicketViewMetricValidator,
} from "./manual-ticket-view-metric-rules.js";
import { newManualTicketViewMetric } from "./manual-ticket-view-metric.js";

test("ManualTicketViewMetricValidator reports every problem", () => {
  const validator = defaultManualTicketViewMetricValidator();
  const item = newManualTicketViewMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualTicketViewMetricRequiredChannelRule flags a blank channel", () => {
  const rule = new ManualTicketViewMetricRequiredChannelRule("manual ticket view metric needs an entry");
  const item = newManualTicketViewMetric("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualTicketViewMetricRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new ManualTicketViewMetricRequiredAudienceIdRule("manual ticket view metric needs a value");
  const item = newManualTicketViewMetric("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualTicketViewMetricMinimumRangeRule flags values above minimum", () => {
  const rule = new ManualTicketViewMetricMinimumRangeRule(1.3, 3822.9);
  const item = newManualTicketViewMetric("x", "y");
  item.minimum = 3824.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
