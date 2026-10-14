import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalSubscriptionSegmentView,
  toSeasonalSubscriptionSegmentViews,
} from "./seasonal-subscription-segment-view.js";
import { newSeasonalSubscriptionSegment } from "./seasonal-subscription-segment.js";

test("SeasonalSubscriptionSegmentView shows the status in capitals", () => {
  const item = newSeasonalSubscriptionSegment("code-376", "name-860");
  const view = toSeasonalSubscriptionSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalSubscriptionSegmentViews([item, item]).length, 2, "views");
});
