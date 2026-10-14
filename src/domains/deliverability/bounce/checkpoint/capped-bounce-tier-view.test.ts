import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedBounceTierView, toCappedBounceTierViews } from "./capped-bounce-tier-view.js";
import { newCappedBounceTier } from "./capped-bounce-tier.js";

test("CappedBounceTierView shows the status in capitals", () => {
  const item = newCappedBounceTier("code-101", "name-929");
  const view = toCappedBounceTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedBounceTierViews([item, item]).length, 2, "views");
});
