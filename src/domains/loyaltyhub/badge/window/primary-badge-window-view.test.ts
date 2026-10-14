import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryBadgeWindowView, toPrimaryBadgeWindowViews } from "./primary-badge-window-view.js";
import { newPrimaryBadgeWindow } from "./primary-badge-window.js";

test("PrimaryBadgeWindowView shows the status in capitals", () => {
  const item = newPrimaryBadgeWindow("code-454", "name-496");
  const view = toPrimaryBadgeWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryBadgeWindowViews([item, item]).length, 2, "views");
});
