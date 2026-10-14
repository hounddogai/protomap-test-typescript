import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledRetentionWindowView,
  toScheduledRetentionWindowViews,
} from "./scheduled-retention-window-view.js";
import { newScheduledRetentionWindow } from "./scheduled-retention-window.js";

test("ScheduledRetentionWindowView shows the status in capitals", () => {
  const item = newScheduledRetentionWindow("code-26", "name-733");
  const view = toScheduledRetentionWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledRetentionWindowViews([item, item]).length, 2, "views");
});
