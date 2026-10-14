import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationNoticeView, toReputationNoticeViews } from "./reputation-notice-view.js";
import { newReputationNotice } from "./reputation-notice.js";

test("ReputationNoticeView shows the status in capitals", () => {
  const item = newReputationNotice("code-544", "label-432");
  const view = toReputationNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationNoticeViews([item, item]).length, 2, "views");
});
