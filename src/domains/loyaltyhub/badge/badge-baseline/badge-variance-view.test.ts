import assert from "node:assert/strict";
import { test } from "node:test";
import { toBadgeVarianceView, toBadgeVarianceViews } from "./badge-variance-view.js";
import { newBadgeVariance } from "./badge-variance.js";

test("BadgeVarianceView shows the status in capitals", () => {
  const item = newBadgeVariance("code-262", "name-445");
  const view = toBadgeVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBadgeVarianceViews([item, item]).length, 2, "views");
});
