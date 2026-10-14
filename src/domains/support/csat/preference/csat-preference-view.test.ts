import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatPreferenceView, toCsatPreferenceViews } from "./csat-preference-view.js";
import { newCsatPreference } from "./csat-preference.js";

test("CsatPreferenceView shows the status in capitals", () => {
  const item = newCsatPreference("code-351", "label-388");
  const view = toCsatPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatPreferenceViews([item, item]).length, 2, "views");
});
