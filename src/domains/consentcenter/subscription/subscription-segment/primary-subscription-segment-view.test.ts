import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPrimarySubscriptionSegmentView,
  toPrimarySubscriptionSegmentViews,
} from "./primary-subscription-segment-view.js";
import { newPrimarySubscriptionSegment } from "./primary-subscription-segment.js";

test("PrimarySubscriptionSegmentView shows the status in capitals", () => {
  const item = newPrimarySubscriptionSegment("code-447", "title-201");
  const view = toPrimarySubscriptionSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimarySubscriptionSegmentViews([item, item]).length, 2, "views");
});
