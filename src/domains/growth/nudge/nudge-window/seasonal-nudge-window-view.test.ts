import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalNudgeWindowView, toSeasonalNudgeWindowViews } from "./seasonal-nudge-window-view.js";
import { newSeasonalNudgeWindow } from "./seasonal-nudge-window.js";

test("SeasonalNudgeWindowView shows the status in capitals", () => {
  const item = newSeasonalNudgeWindow("code-662", "title-83");
  const view = toSeasonalNudgeWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalNudgeWindowViews([item, item]).length, 2, "views");
});
