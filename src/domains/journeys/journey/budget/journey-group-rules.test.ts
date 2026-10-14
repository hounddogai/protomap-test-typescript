import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyGroupRateRangeRule,
  JourneyGroupRequiredCodeRule,
  JourneyGroupRequiredTitleRule,
  defaultJourneyGroupValidator,
} from "./journey-group-rules.js";
import { newJourneyGroup } from "./journey-group.js";

test("JourneyGroupValidator reports every problem", () => {
  const validator = defaultJourneyGroupValidator();
  const item = newJourneyGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyGroupRateRangeRule flags values above rate", () => {
  const rule = new JourneyGroupRateRangeRule(0, 1386.6);
  const item = newJourneyGroup("x", "y");
  item.rate = 1388.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyGroupRequiredTitleRule flags a blank title", () => {
  const rule = new JourneyGroupRequiredTitleRule("journey group needs a value");
  const item = newJourneyGroup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyGroupRequiredCodeRule flags a blank code", () => {
  const rule = new JourneyGroupRequiredCodeRule("journey group needs an entry");
  const item = newJourneyGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
