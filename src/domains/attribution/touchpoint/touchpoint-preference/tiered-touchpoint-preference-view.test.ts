import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredTouchpointPreferenceView,
  toTieredTouchpointPreferenceViews,
} from "./tiered-touchpoint-preference-view.js";
import { newTieredTouchpointPreference } from "./tiered-touchpoint-preference.js";

test("TieredTouchpointPreferenceView shows the status in capitals", () => {
  const item = newTieredTouchpointPreference("code-980", "name-617");
  const view = toTieredTouchpointPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredTouchpointPreferenceViews([item, item]).length, 2, "views");
});
