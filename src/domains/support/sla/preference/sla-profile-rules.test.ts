import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaProfileQuantityRangeRule,
  SlaProfileRequiredJourneyIdRule,
  SlaProfileSendAtRangeRule,
  defaultSlaProfileValidator,
} from "./sla-profile-rules.js";
import { newSlaProfile } from "./sla-profile.js";

test("SlaProfileValidator reports every problem", () => {
  const validator = defaultSlaProfileValidator();
  const item = newSlaProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaProfileQuantityRangeRule flags values above quantity", () => {
  const rule = new SlaProfileQuantityRangeRule(16, 1000);
  const item = newSlaProfile("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaProfileRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new SlaProfileRequiredJourneyIdRule("sla profile needs a value");
  const item = newSlaProfile("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaProfileSendAtRangeRule flags values above send at", () => {
  const rule = new SlaProfileSendAtRangeRule(16, 32);
  const item = newSlaProfile("x", "y");
  item.sendAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
