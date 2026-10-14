import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierWindowView, toTierWindowViews } from "./tier-window-view.js";
import { newTierWindow } from "./tier-window.js";

test("TierWindowView shows the status in capitals", () => {
  const item = newTierWindow("code-613", "name-88");
  const view = toTierWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierWindowViews([item, item]).length, 2, "views");
});
