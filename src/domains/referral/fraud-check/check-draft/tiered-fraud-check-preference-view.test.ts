import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredFraudCheckPreferenceView,
  toTieredFraudCheckPreferenceViews,
} from "./tiered-fraud-check-preference-view.js";
import { newTieredFraudCheckPreference } from "./tiered-fraud-check-preference.js";

test("TieredFraudCheckPreferenceView shows the status in capitals", () => {
  const item = newTieredFraudCheckPreference("code-496", "name-155");
  const view = toTieredFraudCheckPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredFraudCheckPreferenceViews([item, item]).length, 2, "views");
});
