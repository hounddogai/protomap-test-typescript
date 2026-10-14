import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualTierWindowView, toManualTierWindowViews } from "./manual-tier-window-view.js";
import { newManualTierWindow } from "./manual-tier-window.js";

test("ManualTierWindowView shows the status in capitals", () => {
  const item = newManualTierWindow("code-104", "title-706");
  const view = toManualTierWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualTierWindowViews([item, item]).length, 2, "views");
});
