import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalWarmupWindowView, toSeasonalWarmupWindowViews } from "./seasonal-warmup-window-view.js";
import { newSeasonalWarmupWindow } from "./seasonal-warmup-window.js";

test("SeasonalWarmupWindowView shows the status in capitals", () => {
  const item = newSeasonalWarmupWindow("code-591", "title-576");
  const view = toSeasonalWarmupWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalWarmupWindowViews([item, item]).length, 2, "views");
});
