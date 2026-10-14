import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInNoticeView, toDoubleOptInNoticeViews } from "./double-opt-in-notice-view.js";
import { newDoubleOptInNotice } from "./double-opt-in-notice.js";

test("DoubleOptInNoticeView shows the status in capitals", () => {
  const item = newDoubleOptInNotice("code-702", "title-342");
  const view = toDoubleOptInNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInNoticeViews([item, item]).length, 2, "views");
});
