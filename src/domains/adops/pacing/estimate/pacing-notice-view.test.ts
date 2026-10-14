import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingNoticeView, toPacingNoticeViews } from "./pacing-notice-view.js";
import { newPacingNotice } from "./pacing-notice.js";

test("PacingNoticeView shows the status in capitals", () => {
  const item = newPacingNotice("code-321", "name-573");
  const view = toPacingNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingNoticeViews([item, item]).length, 2, "views");
});
