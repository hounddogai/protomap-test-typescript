import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalQueueProfileView, toRegionalQueueProfileViews } from "./regional-queue-profile-view.js";
import { newRegionalQueueProfile } from "./regional-queue-profile.js";

test("RegionalQueueProfileView shows the status in capitals", () => {
  const item = newRegionalQueueProfile("code-171", "name-113");
  const view = toRegionalQueueProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalQueueProfileViews([item, item]).length, 2, "views");
});
