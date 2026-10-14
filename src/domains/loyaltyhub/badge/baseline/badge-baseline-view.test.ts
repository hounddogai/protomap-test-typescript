import assert from "node:assert/strict";
import { test } from "node:test";
import { toBadgeBaselineView, toBadgeBaselineViews } from "./badge-baseline-view.js";
import { newBadgeBaseline } from "./badge-baseline.js";

test("BadgeBaselineView shows the status in capitals", () => {
  const item = newBadgeBaseline("code-421", "name-361");
  const view = toBadgeBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBadgeBaselineViews([item, item]).length, 2, "views");
});
