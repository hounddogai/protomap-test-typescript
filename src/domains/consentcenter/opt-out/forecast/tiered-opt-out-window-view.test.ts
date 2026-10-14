import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredOptOutWindowView, toTieredOptOutWindowViews } from "./tiered-opt-out-window-view.js";
import { newTieredOptOutWindow } from "./tiered-opt-out-window.js";

test("TieredOptOutWindowView shows the status in capitals", () => {
  const item = newTieredOptOutWindow("code-903", "name-748");
  const view = toTieredOptOutWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredOptOutWindowViews([item, item]).length, 2, "views");
});
