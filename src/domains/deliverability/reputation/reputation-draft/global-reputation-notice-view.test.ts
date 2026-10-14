import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalReputationNoticeView, toGlobalReputationNoticeViews } from "./global-reputation-notice-view.js";
import { newGlobalReputationNotice } from "./global-reputation-notice.js";

test("GlobalReputationNoticeView shows the status in capitals", () => {
  const item = newGlobalReputationNotice("code-750", "title-645");
  const view = toGlobalReputationNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalReputationNoticeViews([item, item]).length, 2, "views");
});
