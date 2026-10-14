import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalQueuePreferenceView, toRegionalQueuePreferenceViews } from "./regional-queue-preference-view.js";
import { newRegionalQueuePreference } from "./regional-queue-preference.js";

test("RegionalQueuePreferenceView shows the status in capitals", () => {
  const item = newRegionalQueuePreference("code-844", "name-614");
  const view = toRegionalQueuePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalQueuePreferenceViews([item, item]).length, 2, "views");
});
