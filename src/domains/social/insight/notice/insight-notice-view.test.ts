import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightNoticeView, toInsightNoticeViews } from "./insight-notice-view.js";
import { newInsightNotice } from "./insight-notice.js";

test("InsightNoticeView shows the status in capitals", () => {
  const item = newInsightNotice("code-319", "title-660");
  const view = toInsightNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightNoticeViews([item, item]).length, 2, "views");
});
