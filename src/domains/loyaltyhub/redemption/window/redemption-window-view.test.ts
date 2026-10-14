import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionWindowView, toRedemptionWindowViews } from "./redemption-window-view.js";
import { newRedemptionWindow } from "./redemption-window.js";

test("RedemptionWindowView shows the status in capitals", () => {
  const item = newRedemptionWindow("code-828", "title-281");
  const view = toRedemptionWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionWindowViews([item, item]).length, 2, "views");
});
