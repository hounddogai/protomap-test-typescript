import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualBadgeTierView, toManualBadgeTierViews } from "./manual-badge-tier-view.js";
import { newManualBadgeTier } from "./manual-badge-tier.js";

test("ManualBadgeTierView shows the status in capitals", () => {
  const item = newManualBadgeTier("code-910", "name-718");
  const view = toManualBadgeTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualBadgeTierViews([item, item]).length, 2, "views");
});
