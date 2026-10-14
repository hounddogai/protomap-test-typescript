import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultSubscriptionCycleView,
  toDefaultSubscriptionCycleViews,
} from "./default-subscription-cycle-view.js";
import { newDefaultSubscriptionCycle } from "./default-subscription-cycle.js";

test("DefaultSubscriptionCycleView shows the status in capitals", () => {
  const item = newDefaultSubscriptionCycle("code-943", "label-591");
  const view = toDefaultSubscriptionCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultSubscriptionCycleViews([item, item]).length, 2, "views");
});
