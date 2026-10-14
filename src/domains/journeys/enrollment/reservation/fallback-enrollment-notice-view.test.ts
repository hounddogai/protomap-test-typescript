import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackEnrollmentNoticeView,
  toFallbackEnrollmentNoticeViews,
} from "./fallback-enrollment-notice-view.js";
import { newFallbackEnrollmentNotice } from "./fallback-enrollment-notice.js";

test("FallbackEnrollmentNoticeView shows the status in capitals", () => {
  const item = newFallbackEnrollmentNotice("code-975", "title-167");
  const view = toFallbackEnrollmentNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackEnrollmentNoticeViews([item, item]).length, 2, "views");
});
