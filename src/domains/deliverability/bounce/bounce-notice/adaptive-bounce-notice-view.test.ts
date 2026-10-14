import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveBounceNoticeView, toAdaptiveBounceNoticeViews } from "./adaptive-bounce-notice-view.js";
import { newAdaptiveBounceNotice } from "./adaptive-bounce-notice.js";

test("AdaptiveBounceNoticeView shows the status in capitals", () => {
  const item = newAdaptiveBounceNotice("code-849", "name-951");
  const view = toAdaptiveBounceNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveBounceNoticeViews([item, item]).length, 2, "views");
});
