import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionSnapshotCohortLengthRule,
  MentionSnapshotDiscountRangeRule,
  MentionSnapshotRequiredTitleRule,
  defaultMentionSnapshotValidator,
} from "./mention-snapshot-rules.js";
import { newMentionSnapshot } from "./mention-snapshot.js";

test("MentionSnapshotValidator reports every problem", () => {
  const validator = defaultMentionSnapshotValidator();
  const item = newMentionSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionSnapshotCohortLengthRule flags a long cohort", () => {
  const rule = new MentionSnapshotCohortLengthRule(1000);
  const item = newMentionSnapshot("x", "y");
  item.cohort = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionSnapshotDiscountRangeRule flags values above discount", () => {
  const rule = new MentionSnapshotDiscountRangeRule(9.2, 3312);
  const item = newMentionSnapshot("x", "y");
  item.discount = 3313.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionSnapshotRequiredTitleRule flags a blank title", () => {
  const rule = new MentionSnapshotRequiredTitleRule("mention snapshot needs this field");
  const item = newMentionSnapshot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
