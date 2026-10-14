import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toGlobalFraudCheckPreferenceView,
  toGlobalFraudCheckPreferenceViews,
} from "./global-fraud-check-preference-view.js";
import { newGlobalFraudCheckPreference } from "./global-fraud-check-preference.js";

test("GlobalFraudCheckPreferenceView shows the status in capitals", () => {
  const item = newGlobalFraudCheckPreference("code-211", "name-556");
  const view = toGlobalFraudCheckPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalFraudCheckPreferenceViews([item, item]).length, 2, "views");
});
