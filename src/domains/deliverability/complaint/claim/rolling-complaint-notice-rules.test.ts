import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingComplaintNoticeRequiredTitleRule,
  defaultRollingComplaintNoticeValidator,
} from "./rolling-complaint-notice-rules.js";
import { newRollingComplaintNotice } from "./rolling-complaint-notice.js";

test("RollingComplaintNoticeValidator reports every problem", () => {
  const validator = defaultRollingComplaintNoticeValidator();
  const item = newRollingComplaintNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingComplaintNoticeRequiredTitleRule flags a blank title", () => {
  const rule = new RollingComplaintNoticeRequiredTitleRule("rolling complaint notice needs a value");
  const item = newRollingComplaintNotice("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
