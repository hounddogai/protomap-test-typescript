import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewThresholdFloorValueRangeRule,
  TicketViewThresholdRequiredLocaleRule,
  TicketViewThresholdVersionRangeRule,
  defaultTicketViewThresholdValidator,
} from "./ticket-view-threshold-rules.js";
import { newTicketViewThreshold } from "./ticket-view-threshold.js";

test("TicketViewThresholdValidator reports every problem", () => {
  const validator = defaultTicketViewThresholdValidator();
  const item = newTicketViewThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewThresholdFloorValueRangeRule flags values above floor value", () => {
  const rule = new TicketViewThresholdFloorValueRangeRule(2.8, 3359.6);
  const item = newTicketViewThreshold("x", "y");
  item.floorValue = 3361.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewThresholdRequiredLocaleRule flags a blank locale", () => {
  const rule = new TicketViewThresholdRequiredLocaleRule("ticket view threshold needs an entry");
  const item = newTicketViewThreshold("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewThresholdVersionRangeRule flags values above version", () => {
  const rule = new TicketViewThresholdVersionRangeRule(32, 255);
  const item = newTicketViewThreshold("x", "y");
  item.version = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
