import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultBadgeGroupView, toDefaultBadgeGroupViews } from "./default-badge-group-view.js";
import { newDefaultBadgeGroup } from "./default-badge-group.js";

test("DefaultBadgeGroupView shows the status in capitals", () => {
  const item = newDefaultBadgeGroup("code-298", "label-500");
  const view = toDefaultBadgeGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultBadgeGroupViews([item, item]).length, 2, "views");
});
