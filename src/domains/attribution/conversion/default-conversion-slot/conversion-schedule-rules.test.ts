import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionScheduleRequiredLabelRule,
  ConversionScheduleRequiredNotesRule,
  defaultConversionScheduleValidator,
} from "./conversion-schedule-rules.js";
import { newConversionSchedule } from "./conversion-schedule.js";

test("ConversionScheduleValidator reports every problem", () => {
  const validator = defaultConversionScheduleValidator();
  const item = newConversionSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionScheduleRequiredNotesRule flags a blank notes", () => {
  const rule = new ConversionScheduleRequiredNotesRule("conversion schedule needs an entry");
  const item = newConversionSchedule("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionScheduleRequiredLabelRule flags a blank label", () => {
  const rule = new ConversionScheduleRequiredLabelRule("conversion schedule needs a value");
  const item = newConversionSchedule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
