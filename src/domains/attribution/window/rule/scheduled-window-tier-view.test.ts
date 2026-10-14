import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledWindowTierView, toScheduledWindowTierViews } from "./scheduled-window-tier-view.js";
import { newScheduledWindowTier } from "./scheduled-window-tier.js";

test("ScheduledWindowTierView shows the status in capitals", () => {
  const item = newScheduledWindowTier("code-686", "title-85");
  const view = toScheduledWindowTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledWindowTierViews([item, item]).length, 2, "views");
});
