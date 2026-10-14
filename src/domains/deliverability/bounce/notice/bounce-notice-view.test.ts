import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceNoticeView, toBounceNoticeViews } from "./bounce-notice-view.js";
import { newBounceNotice } from "./bounce-notice.js";

test("BounceNoticeView shows the status in capitals", () => {
  const item = newBounceNotice("code-980", "label-904");
  const view = toBounceNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceNoticeViews([item, item]).length, 2, "views");
});
