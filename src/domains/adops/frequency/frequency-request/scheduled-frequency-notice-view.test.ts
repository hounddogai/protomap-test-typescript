import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledFrequencyNoticeView,
  toScheduledFrequencyNoticeViews,
} from "./scheduled-frequency-notice-view.js";
import { newScheduledFrequencyNotice } from "./scheduled-frequency-notice.js";

test("ScheduledFrequencyNoticeView shows the status in capitals", () => {
  const item = newScheduledFrequencyNotice("code-600", "label-600");
  const view = toScheduledFrequencyNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledFrequencyNoticeViews([item, item]).length, 2, "views");
});
