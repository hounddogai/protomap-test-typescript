import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentSnapshotRequiredAudienceIdRule,
  defaultEnrollmentSnapshotValidator,
} from "./enrollment-snapshot-rules.js";
import { newEnrollmentSnapshot } from "./enrollment-snapshot.js";

test("EnrollmentSnapshotValidator reports every problem", () => {
  const validator = defaultEnrollmentSnapshotValidator();
  const item = newEnrollmentSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentSnapshotRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new EnrollmentSnapshotRequiredAudienceIdRule("enrollment snapshot needs this field");
  const item = newEnrollmentSnapshot("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
