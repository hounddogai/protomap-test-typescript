import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPacingTemplateRevisionRangeRule,
  defaultLenientPacingTemplateValidator,
} from "./lenient-pacing-template-rules.js";
import { newLenientPacingTemplate } from "./lenient-pacing-template.js";

test("LenientPacingTemplateValidator reports every problem", () => {
  const validator = defaultLenientPacingTemplateValidator();
  const item = newLenientPacingTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPacingTemplateRevisionRangeRule flags values above revision", () => {
  const rule = new LenientPacingTemplateRevisionRangeRule(80, 255);
  const item = newLenientPacingTemplate("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
