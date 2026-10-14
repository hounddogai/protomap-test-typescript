import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveRetentionPreferenceView,
  toAdaptiveRetentionPreferenceViews,
} from "./adaptive-retention-preference-view.js";
import { newAdaptiveRetentionPreference } from "./adaptive-retention-preference.js";

test("AdaptiveRetentionPreferenceView shows the status in capitals", () => {
  const item = newAdaptiveRetentionPreference("code-976", "label-466");
  const view = toAdaptiveRetentionPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveRetentionPreferenceViews([item, item]).length, 2, "views");
});
