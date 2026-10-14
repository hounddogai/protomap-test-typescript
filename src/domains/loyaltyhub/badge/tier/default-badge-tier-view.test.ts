import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultBadgeTierView, toDefaultBadgeTierViews } from "./default-badge-tier-view.js";
import { newDefaultBadgeTier } from "./default-badge-tier.js";

test("DefaultBadgeTierView shows the status in capitals", () => {
  const item = newDefaultBadgeTier("code-359", "label-800");
  const view = toDefaultBadgeTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultBadgeTierViews([item, item]).length, 2, "views");
});
