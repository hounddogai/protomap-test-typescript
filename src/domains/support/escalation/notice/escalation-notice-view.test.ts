import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationNoticeView, toEscalationNoticeViews } from "./escalation-notice-view.js";
import { newEscalationNotice } from "./escalation-notice.js";

test("EscalationNoticeView shows the status in capitals", () => {
  const item = newEscalationNotice("code-556", "title-867");
  const view = toEscalationNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationNoticeViews([item, item]).length, 2, "views");
});
