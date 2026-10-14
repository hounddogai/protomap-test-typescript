import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalSlaPreferenceView, toGlobalSlaPreferenceViews } from "./global-sla-preference-view.js";
import { newGlobalSlaPreference } from "./global-sla-preference.js";

test("GlobalSlaPreferenceView shows the status in capitals", () => {
  const item = newGlobalSlaPreference("code-149", "label-917");
  const view = toGlobalSlaPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalSlaPreferenceViews([item, item]).length, 2, "views");
});
