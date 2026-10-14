import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelNoticeView, toModelNoticeViews } from "./model-notice-view.js";
import { newModelNotice } from "./model-notice.js";

test("ModelNoticeView shows the status in capitals", () => {
  const item = newModelNotice("code-66", "label-643");
  const view = toModelNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelNoticeViews([item, item]).length, 2, "views");
});
