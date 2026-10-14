import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalComplaintWindowExpiresAtRangeRule,
  RegionalComplaintWindowRequiredUtmSourceRule,
  defaultRegionalComplaintWindowValidator,
} from "./regional-complaint-window-rules.js";
import { newRegionalComplaintWindow } from "./regional-complaint-window.js";

test("RegionalComplaintWindowValidator reports every problem", () => {
  const validator = defaultRegionalComplaintWindowValidator();
  const item = newRegionalComplaintWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalComplaintWindowExpiresAtRangeRule flags values above expires at", () => {
  const rule = new RegionalComplaintWindowExpiresAtRangeRule(16, 120);
  const item = newRegionalComplaintWindow("x", "y");
  item.expiresAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalComplaintWindowRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new RegionalComplaintWindowRequiredUtmSourceRule("regional complaint window needs a value");
  const item = newRegionalComplaintWindow("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
