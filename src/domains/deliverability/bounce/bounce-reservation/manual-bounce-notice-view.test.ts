import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualBounceNoticeView, toManualBounceNoticeViews } from "./manual-bounce-notice-view.js";
import { newManualBounceNotice } from "./manual-bounce-notice.js";

test("ManualBounceNoticeView shows the status in capitals", () => {
  const item = newManualBounceNotice("code-135", "title-747");
  const view = toManualBounceNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualBounceNoticeViews([item, item]).length, 2, "views");
});
