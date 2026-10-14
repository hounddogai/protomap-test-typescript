import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalActivationWindowView,
  toSeasonalActivationWindowViews,
} from "./seasonal-activation-window-view.js";
import { newSeasonalActivationWindow } from "./seasonal-activation-window.js";

test("SeasonalActivationWindowView shows the status in capitals", () => {
  const item = newSeasonalActivationWindow("code-305", "title-529");
  const view = toSeasonalActivationWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalActivationWindowViews([item, item]).length, 2, "views");
});
