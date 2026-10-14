import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveCreditNoticeView, toAdaptiveCreditNoticeViews } from "./adaptive-credit-notice-view.js";
import { newAdaptiveCreditNotice } from "./adaptive-credit-notice.js";

test("AdaptiveCreditNoticeView shows the status in capitals", () => {
  const item = newAdaptiveCreditNotice("code-451", "title-88");
  const view = toAdaptiveCreditNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveCreditNoticeViews([item, item]).length, 2, "views");
});
