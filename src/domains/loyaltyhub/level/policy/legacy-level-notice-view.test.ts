import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyLevelNoticeView, toLegacyLevelNoticeViews } from "./legacy-level-notice-view.js";
import { newLegacyLevelNotice } from "./legacy-level-notice.js";

test("LegacyLevelNoticeView shows the status in capitals", () => {
  const item = newLegacyLevelNotice("code-861", "title-321");
  const view = toLegacyLevelNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyLevelNoticeViews([item, item]).length, 2, "views");
});
