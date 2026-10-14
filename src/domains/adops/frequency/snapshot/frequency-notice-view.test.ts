import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyNoticeView, toFrequencyNoticeViews } from "./frequency-notice-view.js";
import { newFrequencyNotice } from "./frequency-notice.js";

test("FrequencyNoticeView shows the status in capitals", () => {
  const item = newFrequencyNotice("code-883", "label-37");
  const view = toFrequencyNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyNoticeViews([item, item]).length, 2, "views");
});
