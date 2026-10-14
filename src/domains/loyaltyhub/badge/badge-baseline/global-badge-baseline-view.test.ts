import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalBadgeBaselineView, toGlobalBadgeBaselineViews } from "./global-badge-baseline-view.js";
import { newGlobalBadgeBaseline } from "./global-badge-baseline.js";

test("GlobalBadgeBaselineView shows the status in capitals", () => {
  const item = newGlobalBadgeBaseline("code-634", "label-377");
  const view = toGlobalBadgeBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalBadgeBaselineViews([item, item]).length, 2, "views");
});
