import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutPreferenceView, toPayoutPreferenceViews } from "./payout-preference-view.js";
import { newPayoutPreference } from "./payout-preference.js";

test("PayoutPreferenceView shows the status in capitals", () => {
  const item = newPayoutPreference("code-672", "title-694");
  const view = toPayoutPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutPreferenceViews([item, item]).length, 2, "views");
});
