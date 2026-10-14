import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackFraudCheckWindowView,
  toFallbackFraudCheckWindowViews,
} from "./fallback-fraud-check-window-view.js";
import { newFallbackFraudCheckWindow } from "./fallback-fraud-check-window.js";

test("FallbackFraudCheckWindowView shows the status in capitals", () => {
  const item = newFallbackFraudCheckWindow("code-199", "name-177");
  const view = toFallbackFraudCheckWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackFraudCheckWindowViews([item, item]).length, 2, "views");
});
