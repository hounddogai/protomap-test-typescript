import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentNoticeView, toEnrollmentNoticeViews } from "./enrollment-notice-view.js";
import { newEnrollmentNotice } from "./enrollment-notice.js";

test("EnrollmentNoticeView shows the status in capitals", () => {
  const item = newEnrollmentNotice("code-561", "name-597");
  const view = toEnrollmentNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentNoticeViews([item, item]).length, 2, "views");
});
