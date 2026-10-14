import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyNudgeNoticeView, toLegacyNudgeNoticeViews } from "./legacy-nudge-notice-view.js";
import { newLegacyNudgeNotice } from "./legacy-nudge-notice.js";

test("LegacyNudgeNoticeView shows the status in capitals", () => {
  const item = newLegacyNudgeNotice("code-597", "label-251");
  const view = toLegacyNudgeNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyNudgeNoticeViews([item, item]).length, 2, "views");
});
