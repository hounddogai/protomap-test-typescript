import assert from "node:assert/strict";
import { test } from "node:test";
import { toBadgeOverrideView, toBadgeOverrideViews } from "./badge-override-view.js";
import { newBadgeOverride } from "./badge-override.js";

test("BadgeOverrideView shows the status in capitals", () => {
  const item = newBadgeOverride("code-189", "title-206");
  const view = toBadgeOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBadgeOverrideViews([item, item]).length, 2, "views");
});
