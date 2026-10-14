import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalCreativeNoticeView, toSeasonalCreativeNoticeViews } from "./seasonal-creative-notice-view.js";
import { newSeasonalCreativeNotice } from "./seasonal-creative-notice.js";

test("SeasonalCreativeNoticeView shows the status in capitals", () => {
  const item = newSeasonalCreativeNotice("code-661", "name-557");
  const view = toSeasonalCreativeNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalCreativeNoticeViews([item, item]).length, 2, "views");
});
