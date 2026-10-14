import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveSubscriptionCheckpointView,
  toAdaptiveSubscriptionCheckpointViews,
} from "./adaptive-subscription-checkpoint-view.js";
import { newAdaptiveSubscriptionCheckpoint } from "./adaptive-subscription-checkpoint.js";

test("AdaptiveSubscriptionCheckpointView shows the status in capitals", () => {
  const item = newAdaptiveSubscriptionCheckpoint("code-370", "title-600");
  const view = toAdaptiveSubscriptionCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveSubscriptionCheckpointViews([item, item]).length, 2, "views");
});
