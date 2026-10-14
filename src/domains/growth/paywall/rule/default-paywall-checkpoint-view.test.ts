import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultPaywallCheckpointView,
  toDefaultPaywallCheckpointViews,
} from "./default-paywall-checkpoint-view.js";
import { newDefaultPaywallCheckpoint } from "./default-paywall-checkpoint.js";

test("DefaultPaywallCheckpointView shows the status in capitals", () => {
  const item = newDefaultPaywallCheckpoint("code-642", "name-734");
  const view = toDefaultPaywallCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultPaywallCheckpointViews([item, item]).length, 2, "views");
});
