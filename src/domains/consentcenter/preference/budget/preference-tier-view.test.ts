import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceTierView, toPreferenceTierViews } from "./preference-tier-view.js";
import { newPreferenceTier } from "./preference-tier.js";

test("PreferenceTierView shows the status in capitals", () => {
  const item = newPreferenceTier("code-780", "label-756");
  const view = toPreferenceTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceTierViews([item, item]).length, 2, "views");
});
