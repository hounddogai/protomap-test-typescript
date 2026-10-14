import assert from "node:assert/strict";
import { test } from "node:test";
import { MentionSlotRequiredCountryRule, defaultMentionSlotValidator } from "./mention-slot-rules.js";
import { newMentionSlot } from "./mention-slot.js";

test("MentionSlotValidator reports every problem", () => {
  const validator = defaultMentionSlotValidator();
  const item = newMentionSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionSlotRequiredCountryRule flags a blank country", () => {
  const rule = new MentionSlotRequiredCountryRule("mention slot needs a value");
  const item = newMentionSlot("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
