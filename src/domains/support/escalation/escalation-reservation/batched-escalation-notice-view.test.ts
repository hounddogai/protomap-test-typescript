import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedEscalationNoticeView, toBatchedEscalationNoticeViews } from "./batched-escalation-notice-view.js";
import { newBatchedEscalationNotice } from "./batched-escalation-notice.js";

test("BatchedEscalationNoticeView shows the status in capitals", () => {
  const item = newBatchedEscalationNotice("code-744", "label-879");
  const view = toBatchedEscalationNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedEscalationNoticeViews([item, item]).length, 2, "views");
});
