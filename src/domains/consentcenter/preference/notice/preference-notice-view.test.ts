import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceNoticeView, toPreferenceNoticeViews } from "./preference-notice-view.js";
import { newPreferenceNotice } from "./preference-notice.js";

test("PreferenceNoticeView shows the status in capitals", () => {
  const item = newPreferenceNotice("code-291", "name-475");
  const view = toPreferenceNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceNoticeViews([item, item]).length, 2, "views");
});
