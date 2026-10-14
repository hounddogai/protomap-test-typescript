import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckPreferenceView, toFraudCheckPreferenceViews } from "./fraud-check-preference-view.js";
import { newFraudCheckPreference } from "./fraud-check-preference.js";

test("FraudCheckPreferenceView shows the status in capitals", () => {
  const item = newFraudCheckPreference("code-549", "name-433");
  const view = toFraudCheckPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckPreferenceViews([item, item]).length, 2, "views");
});
