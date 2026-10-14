import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredTouchpointOverrideView,
  toTieredTouchpointOverrideViews,
} from "./tiered-touchpoint-override-view.js";
import { newTieredTouchpointOverride } from "./tiered-touchpoint-override.js";

test("TieredTouchpointOverrideView shows the status in capitals", () => {
  const item = newTieredTouchpointOverride("code-215", "label-460");
  const view = toTieredTouchpointOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredTouchpointOverrideViews([item, item]).length, 2, "views");
});
