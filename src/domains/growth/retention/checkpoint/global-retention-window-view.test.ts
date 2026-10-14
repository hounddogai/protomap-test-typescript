import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalRetentionWindowView, toGlobalRetentionWindowViews } from "./global-retention-window-view.js";
import { newGlobalRetentionWindow } from "./global-retention-window.js";

test("GlobalRetentionWindowView shows the status in capitals", () => {
  const item = newGlobalRetentionWindow("code-673", "label-129");
  const view = toGlobalRetentionWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalRetentionWindowViews([item, item]).length, 2, "views");
});
