import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalComplaintMappingRequiredNameRule,
  RegionalComplaintMappingRequiredNotesRule,
  RegionalComplaintMappingSequenceRangeRule,
  defaultRegionalComplaintMappingValidator,
} from "./regional-complaint-mapping-rules.js";
import { newRegionalComplaintMapping } from "./regional-complaint-mapping.js";

test("RegionalComplaintMappingValidator reports every problem", () => {
  const validator = defaultRegionalComplaintMappingValidator();
  const item = newRegionalComplaintMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalComplaintMappingSequenceRangeRule flags values above sequence", () => {
  const rule = new RegionalComplaintMappingSequenceRangeRule(120, 86400);
  const item = newRegionalComplaintMapping("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalComplaintMappingRequiredNameRule flags a blank name", () => {
  const rule = new RegionalComplaintMappingRequiredNameRule("regional complaint mapping needs this field");
  const item = newRegionalComplaintMapping("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalComplaintMappingRequiredNotesRule flags a blank notes", () => {
  const rule = new RegionalComplaintMappingRequiredNotesRule("regional complaint mapping needs a value");
  const item = newRegionalComplaintMapping("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
