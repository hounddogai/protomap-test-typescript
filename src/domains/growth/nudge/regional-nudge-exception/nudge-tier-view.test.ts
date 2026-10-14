import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeTierView, toNudgeTierViews } from "./nudge-tier-view.js";
import { newNudgeTier } from "./nudge-tier.js";

test("NudgeTierView shows the status in capitals", () => {
  const item = newNudgeTier("code-75", "name-307");
  const view = toNudgeTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeTierViews([item, item]).length, 2, "views");
});
