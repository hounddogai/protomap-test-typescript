import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutTierView, toOptOutTierViews } from "./opt-out-tier-view.js";
import { newOptOutTier } from "./opt-out-tier.js";

test("OptOutTierView shows the status in capitals", () => {
  const item = newOptOutTier("code-582", "title-832");
  const view = toOptOutTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutTierViews([item, item]).length, 2, "views");
});
